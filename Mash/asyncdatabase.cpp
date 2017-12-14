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
    qDebug() << "DatabaseList::load : opening : " << dbPath;
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
        qDebug() << "DatabaseList::load : no database at : " << dbPath << " : creating default";
        //save();
        if (db.open(QIODevice::WriteOnly)) {
            QJsonDocument doc;
            doc.setArray(QJsonArray());
            db.write(doc.toJson());
        }
    }
    emit success(Load,QVariant());
}

void AsyncDatabase::save() {
    QMutexLocker locker(&m_guard);
    QString dbPath = _path();
    QFile db(dbPath);
    qDebug() << "AsyncDatabase::save : opening : " << dbPath;
    if (db.open(QIODevice::WriteOnly)) {
        qDebug() << "AsyncDatabase::save : writing documents";
        QJsonArray array;
        try {
            if ( m_documents.size() > 0 ) {
                for ( auto& object : m_documents ) {
                    array.append(QJsonValue::fromVariant(QVariant(object)));
                }
            }
            QJsonDocument doc;
            doc.setArray(array);
            db.write(doc.toJson());
        } catch( ... ) {
            qDebug() << "AsyncDatabase::save : error writing documents";
        }

        qDebug() << "AsyncDatabase::save : done";
    } else {
        qDebug() << "DatabaseList::save : unable to open : " << dbPath;
        emit error(Save,dbPath.prepend("unable to open file : "));
    }
    emit success(Save,QVariant());
}

//
// non blocking
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
        convertDocumentToMash( _document, mash );
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

void AsyncDatabase::sync(QVariant documents) {
    QMutexLocker locker(&m_guard);
    QVariantList _documents = documents.toList();
    //
    // merge old and new
    //
    QList<QVariantMap>  m_new_documents;
    int count = _documents.size();
    for ( int i = 0; i < count; i++ ) {
        QVariantMap new_document = _documents[ i ].toMap();
        QVariantMap query = QVariantMap({{"_id",new_document["_id"]}});
        QVariantMap old_document = _findOne(query);
        if ( !old_document.isEmpty() ) {
            new_document[ "views" ] =  old_document["views"];
        } else {
            new_document[ "views" ] = 0;
        }
        QVariantMap mash;
        convertDocumentToMash( new_document, mash );
        m_new_documents.push_back(mash);
    }
    //
    // swap lists
    //
    m_documents = m_new_documents;
    _sort();
    emit success(Sync,QVariant());
}

void AsyncDatabase::convertDocumentToMash( QVariantMap& document, QVariantMap& mash ) {
    mash["_id"] = document.contains("_id") ? document["_id"] : QUuid::createUuid().toString();
    mash["time"] = document[ "time" ];
    mash["views"] = document.contains("views") ? document["views"] : 0;
    if ( document.contains("mash") ) {
        QVariantMap _mash = document["mash"].toMap();
        mash["type"] = _mash["type"];
        mash["content"] = _mash["content"];
        if ( _mash.contains("source") ) {
            mash["source"] = _mash["source"];
        }
        if ( _mash.contains("tags") ) {
            mash["tags"] = _mash["tags"].toList();
        }
    } else {
        mash["type"] = document["type"];
        mash["content"] = document["content"];
        if ( document.contains("source") ) {
            mash["source"] = document["source"];
        }
        if ( document.contains("tags") ) {
            mash["tags"] = document["tags"].toList();
        }
    }
}
//
// blocking
//
QVariantMap AsyncDatabase::_findOne(QVariantMap query) {
    int count = m_documents.size();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_documents[i],query) ) {
            return m_documents[ i];
        }
    }
    return QVariantMap();
}

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
        if ( query[ it.key() ].type() == QVariant::List  ) { // $and | $or
            qDebug() << "matching list : " << it.key();
            if ( it.key().startsWith("$") ) { // operator
                QVariantList array = query[ it.key() ].toList();
                if ( !_matchList( object, it.key(), array ) ) return false;
            } else { // TODO: could be array

            }
        } else if ( object.contains(it.key()) ) {
            if ( object[ it.key() ].type() == QVariant::List ) {
                QVariantList array = object[ it.key() ].toList();
                for ( int i = 0; i < array.length(); ++i ) {
                    if ( array[ i ] != query[ it.key() ] ) return false;
                }
            } else if( object[ it.key() ] != query[ it.key() ] ) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true;
}

bool AsyncDatabase::_matchList( QVariantMap& object, const QString& selector, QVariantList& list ) {
    if ( selector == "$and" ) {
        for ( int i = 0; i < list.length(); ++i ) {
            QVariantMap map = list[ i ].toMap();
            if ( !_match( object, map) ) return false;
        }
        return true;
    } else if ( selector == "$or" ) {
        for ( int i = 0; i < list.length(); ++i ) {
            QVariantMap map = list[ i ].toMap();
            if ( !_match( object, map) ) return true;
        }
    }
    return false;
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
