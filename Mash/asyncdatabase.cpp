#include "asyncdatabase.h"
#include "systemutils.h"
#include <QJsonDocument>
#include <QJsonArray>
#include <QDebug>
#include <QUuid>
#include <QFile>

AsyncDatabase* AsyncDatabase::s_shared = nullptr;

AsyncDatabase::AsyncDatabase(QObject *parent) : QObject(parent) {
    m_thread.start();
    moveToThread(&m_thread);
}

AsyncDatabase::~AsyncDatabase() {
    //
    // terminate async thread
    //
    m_guard.lock();
    m_thread.terminate();
    m_thread.wait();
    m_guard.unlock();
}
AsyncDatabase* AsyncDatabase::shared() {
    if ( s_shared == nullptr ) {
        s_shared = new AsyncDatabase;
    }
    return s_shared;
}
//
//
//
//
//
//
void AsyncDatabase::load() {
    QMutexLocker locker(&m_guard);
    //
    // clear existing
    //
    m_latest = 0;
    m_documents.clear();
    QString dbPath = _path();
    QFile db(dbPath);
    if (db.open(QIODevice::ReadOnly)) {
        //
        // read file
        //
        QByteArray data = db.readAll();
        //
        // parse JSON
        //
        QJsonParseError parseError;
        QJsonDocument doc(QJsonDocument::fromJson(data,&parseError));
        //
        //
        //
        if ( doc.isArray() ) {
            qDebug() << "DatabaseList : read database";
            QVariantList objects = doc.array().toVariantList();
            //
            for ( auto& object : objects ) {
                QVariantMap _object = object.toMap();
                if ( _object.contains("time") && _object["time"].value<unsigned long>() > m_latest ) m_latest = _object["time"].value<unsigned long>();
                m_documents.append(object.toMap());
            }
        } else {
            if ( parseError.error != QJsonParseError::NoError ) {
                emit error(Load,parseError.errorString());
            } else {
                emit error(Load,"unexpected format");
            }
        }
    } else {
        //
        // create default db
        //
        save();
    }
    emit success(Load,QVariant());
    emit error(Load,"just testing");
}

void AsyncDatabase::save() {
    QMutexLocker locker(&m_guard);
    QString dbPath = _path();
    QFile db(dbPath);
    if (db.open(QIODevice::WriteOnly)) {
        QJsonArray array;
        for ( auto& object : m_documents ) {
            array.append(QJsonValue::fromVariant(QVariant(object)));
        }
        QJsonDocument doc;
        doc.setArray(array);
        db.write(doc.toJson());
    } else {
        qDebug() << "DatabaseList::save : unable to open : " << dbPath;
        emit error(Save,dbPath.prepend("unable to open file : "));
    }
    emit success(Save,QVariant());
}

//
//
//
void AsyncDatabase::clear() {
    QMutexLocker locker(&m_guard);
    if ( m_documents.size() > 0 ) {
        m_documents.clear();
        emit success(Clear,QVariant());
    }
}

void AsyncDatabase::add(QVariant o) {
    QMutexLocker locker(&m_guard);
    QVariantMap object = o.toMap();
    if ( object.contains("time") && object["time"].value<unsigned long>() > m_latest ) m_latest = object["time"].value<unsigned long>();
    if ( !object.contains("_id") ) {
        object["_id"] = QUuid::createUuid().toString();
    }
    m_documents.append(object);
    _sort();
    QVariantMap id;
    id["_id"] = object["_id"];
    emit success(Add,QVariant(id));
}

void AsyncDatabase::addMany(QVariant documents) {
    QMutexLocker locker(&m_guard);
    QVariantList _documents = documents.toList();
    QVariantList matches;
    for ( QVariant& document : _documents ) {
        QVariantMap _document = document.toMap();
        //
        // update latest
        //
        if ( _document.contains("time") && _document["time"].value<unsigned long>() > m_latest ) m_latest = _document["time"].value<unsigned long>();
        //
        // TODO: reformat on server???
        //
        QVariantMap mash;
        mash["_id"] = _document.contains("_id") ? _document["_id"] : QUuid::createUuid().toString();
        mash["time"] = _document[ "time" ];
        mash["views"] = _document.contains("views") ? _document["views"] : 0;
        if ( _document.contains("mash") ) {
            QVariantMap _mash = _document["mash"].toMap();
            mash["type"] = _mash["type"];
            mash["content"] = _mash["content"];
        } else {
            mash["type"] = _document["type"];
            mash["content"] = _document["content"];
        }
        m_documents.append(mash);
        matches.append(QVariantMap({{"_id",mash["_id"]}}));
    }
    _sort();
     emit success(AddMany,QVariant(matches));
}

void AsyncDatabase::update(QVariant query,QVariant document) {
    QMutexLocker locker(&m_guard);
    QVariantMap _query = query.toMap();
    QVariantMap _document = document.toMap();
    QVariantList matches;
    int count = m_documents.size();
    int minIndex = std::numeric_limits<int>::max();
    int maxIndex = std::numeric_limits<int>::min();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_documents[i],_query) ) {
            if ( i < minIndex ) minIndex = i;
            if ( i > maxIndex ) maxIndex = i;
            QVariantMap object = m_documents[i];
            matches.append(QVariantMap({{"_id",object["_id"]}}));
            _update(object,_document);
            m_documents.replace(i,object);
        }
    }
    emit success(Update,QVariant(matches));
}

void AsyncDatabase::remove(QVariant query) {
    QMutexLocker locker(&m_guard);
    QVariantMap _query = query.toMap();
    QVariantList matches;
    for ( int i = 0; i < m_documents.size(); ) {
        if ( _match(m_documents[i],_query) ) {
            matches.append(QVariantMap({{"_id",m_documents[i]["_id"]}}));
            m_documents.removeAt(i);
        } else {
            i++;
        }
    }
    emit success(Remove,QVariant(matches));
}

void AsyncDatabase::find(QVariant query, QVariant order, int limit) {
    QMutexLocker locker(&m_guard);
    QVariantMap _query = query.toMap();
    QList<QVariantMap> matches;
    int count = m_documents.size();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_documents[i],_query) ) {
            matches.append(m_documents[i]);
        }
    }
    if ( !order.isNull() ) {
        QVariantMap _order = order.toMap();
        __sort(matches,_order);
    }
    if( limit > 0 ) {
        matches = matches.mid(0,limit);
    }

    QVariantList result;
    for ( auto& match : matches ) {
        result.append(match);
    }
    emit success(Find,QVariant(result));
}

void AsyncDatabase::findOne(QVariant query) {
    QMutexLocker locker(&m_guard);
    QVariantMap _query = query.toMap();
    int count = m_documents.size();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_documents[i],_query) ) {
            emit success(Get,QVariant(m_documents[i]));
        }
    }
    emit success(FindOne,QVariant());
}

void AsyncDatabase::get(int i) {
    QMutexLocker locker(&m_guard);
    if ( i >= 0 && i < m_documents.size() ) {
        emit success(Get,QVariant(m_documents[i]));
    }
    QString _error("index %1 out of range %2 : %3");
    emit error(Get,_error.arg(i).arg(0).arg(m_documents.size()));
}

void AsyncDatabase::sort(QVariant s) {
    QMutexLocker locker(&m_guard);
    if ( s != m_sort ) {
        m_sort = s.toMap();
        _sort();
    }
}
//
//
//
void AsyncDatabase::_sort() {
    if ( !m_sort.empty() ) {
        __sort(m_documents,m_sort);
    }
}
void AsyncDatabase::__sort(QList<QVariantMap>& list,QVariantMap& s) {
    if ( !s.empty() ) {
        QString field = s.firstKey();
        int direction = s.first().value<int>();
        //qDebug() << "sorting by : " << field << " direction : " << direction;
        std::sort(list.begin(),list.end(),[&field,&direction](const QVariantMap& a, const QVariantMap& b) -> bool {
            bool aHasIt = a.contains(field);
            bool bHasIt = b.contains(field);
            if ( direction > 0 ) {
                if ( aHasIt && bHasIt ) {
                    return a[field] < b[field];
                } else if ( aHasIt && !bHasIt ) {
                    return false;
                } if( !aHasIt && bHasIt ) {
                    return true;
                }
            } else {
                if ( aHasIt && bHasIt ) {
                    return a[field] > b[field];
                } else if ( !aHasIt && bHasIt ) {
                    return false;
                } if( aHasIt && !bHasIt ) {
                    return true;
                }
            }
            return false;
        });
    }
}

bool AsyncDatabase::_match( QVariantMap& object, QVariantMap& query ) {
    for ( QVariantMap::iterator it = query.begin(); it != query.end(); ++it ) {
        if ( !object.contains(it.key()) || object[ it.key() ] != query[ it.key() ] ) return false;
    }
    return true;
}

void AsyncDatabase::_update( QVariantMap& object, QVariantMap& update ) {
    for ( QVariantMap::iterator it = update.begin(); it != update.end(); ++it ) {
        //
        // TODO: handle nested array updates
        //
        object[ it.key() ] = it.value();
    }
}

QString AsyncDatabase::_path() {
    return SystemUtils::shared()->documentDirectory().append("/").append("mash.json");
}
