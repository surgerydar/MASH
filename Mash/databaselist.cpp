#include "databaselist.h"
#include "systemutils.h"
#include <QJsonDocument>
#include <QJsonArray>
#include <QDebug>
#include <QUuid>
//#include <QMutexLocker>

#include "async.h"

DatabaseList::DatabaseList(QObject *parent) : QAbstractListModel(parent), m_guard(/*QMutex::Recursive*/), m_latest(0) {
    //
    // start async operation thread
    //
    Async* async = new Async();
    async->moveToThread(&m_asyncThread);
    connect(&m_asyncThread, &QThread::finished, async, &QObject::deleteLater);
    connect(this, &DatabaseList::asyncOperation, async, &Async::performOperation);
    connect(async, &Async::asyncResult, this, &DatabaseList::asyncResult);
    m_asyncThread.start();
}
DatabaseList::~DatabaseList() {
    //
    // terminate asyn thread
    //
    m_guard.lock();
    m_asyncThread.terminate();
    m_asyncThread.wait();
    m_guard.unlock();
}

//
//
//
QHash<int, QByteArray> DatabaseList::roleNames() const {
    QHash<int, QByteArray> roles;
    for ( int i = 0; i < m_roles.size(); i++ ) {
        roles[ i ] = m_roles[ i ].toUtf8();
    }
    return roles;
}

int DatabaseList::rowCount(const QModelIndex &parent) const {
    return m_objects.size();
}

QVariant DatabaseList::data(const QModelIndex &index, int role) const {
    if ( index.row() >= 0 && index.row() < m_objects.size() && role < m_roles.size() ) {
        return QVariant(m_objects[index.row()][m_roles[role]]);
    }
    return QVariant();
}
//
//
//
void DatabaseList::load() {
    //
    // clear existing
    //
    beginResetModel();
    m_guard.lock();
    m_latest = 0;
    m_objects.clear();
    QString dbPath = _path();
    QFile db(dbPath);
    if (db.open(QIODevice::ReadOnly)) {
        //
        // read
        //
        QByteArray data = db.readAll();
        //
        // parse
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
                m_objects.append(object.toMap());
            }
            //endResetModel();
            //emit dataChanged(createIndex(0,0),createIndex(m_objects.size()-1,0));
            //emit countChanged();
        } else {
            if ( parseError.error != QJsonParseError::NoError ) {
                emit error("open",parseError.errorString());
            } else {
                emit error("open","unexpected format");
            }
        }
    } else {
        //
        // create default db
        //
        save();
    }
    m_guard.unlock();
    endResetModel();
}

void DatabaseList::save() {
    QMutexLocker locker(&m_guard);
    QString dbPath = _path();
    QFile db(dbPath);
    if (db.open(QIODevice::WriteOnly)) {
        QVariantList list;
        for ( auto& object : m_objects ) {
            list.append(QVariant(object));
        }
        QJsonDocument doc;
        doc.setArray(QJsonArray::fromVariantList(list));
        db.write(doc.toJson());
    } else {
        qDebug() << "DatabaseList::save : unable to open : " << dbPath;
        emit error("save",dbPath.prepend("unable to open file : "));
    }
}
//
//
//
void DatabaseList::clear() {
    QMutexLocker locker(&m_guard);
    if ( m_objects.size() > 0 ) {
        //int objectCount = m_objects.size();
        beginResetModel();
        m_objects.clear();
        endResetModel();
        //emit dataChanged(createIndex(0,0),createIndex(objectCount-1,0));
        //emit countChanged();
    }
}

QVariant DatabaseList::add(QVariant o) {
    QVariantMap object = o.toMap();
    if ( object.contains("time") && object["time"].value<unsigned long>() > m_latest ) m_latest = object["time"].value<unsigned long>();
    if ( !object.contains("_id") ) {
        object["_id"] = QUuid::createUuid().toString();
    }
    beginResetModel();
    m_guard.lock();
    m_objects.append(object);
    _sort();
    m_guard.unlock();
    endResetModel();
    //emit dataChanged(createIndex(0,0),createIndex(m_objects.size()-1,0));
    //emit countChanged();
    QVariantMap id;
    id["_id"] = object["_id"];
    return QVariant(id);
}

QVariant DatabaseList::addMany(QVariant entries) {
    QVariantList _entries = entries.toList();
    beginResetModel();
    m_guard.lock();
    for ( QVariant& entry : _entries ) {
        QVariantMap _entry = entry.toMap();
        //
        // update latest
        //
        if ( _entry.contains("time") && _entry["time"].value<unsigned long>() > m_latest ) m_latest = _entry["time"].value<unsigned long>();
        //
        // TODO: reformat on server???
        //
        QVariantMap mash;
        mash["_id"] = _entry.contains("_id") ? _entry["_id"] : QUuid::createUuid().toString();
        mash["time"] = _entry[ "time" ];
        mash["views"] = _entry.contains("views") ? _entry["views"] : 0;
        if ( _entry.contains("mash") ) {
            QVariantMap _mash = _entry["mash"].toMap();
            mash["type"] = _mash["type"];
            mash["content"] = _mash["content"];
        } else {
            mash["type"] = _entry["type"];
            mash["content"] = _entry["content"];
        }
        m_objects.append(mash);
    }
    _sort();
    m_guard.unlock();
    endResetModel();
    return QVariant(); // TODO: perhaps return list of ids
}

QVariant DatabaseList::update(QVariant q,QVariant u) {
    QVariantMap query = q.toMap();
    QVariantMap update = u.toMap();
    QVariantList matches;
    int count = m_objects.size();
    int minIndex = std::numeric_limits<int>::max();
    int maxIndex = std::numeric_limits<int>::min();
    //beginResetModel();
    m_guard.lock();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_objects[i],query) ) {
            if ( i < minIndex ) minIndex = i;
            if ( i > maxIndex ) maxIndex = i;
            QVariantMap object = m_objects[i];
            matches.append(QVariantMap({{"_id",object["_id"]}}));
            _update(object,update);
            m_objects.replace(i,object);
        }
    }
    m_guard.unlock();
    //endResetModel();
    if ( matches.size() > 0 ) {
        qDebug() << "updated from : " << minIndex << " : to : " << maxIndex;
        //emit dataChanged(createIndex(minIndex,0),createIndex(maxIndex,0));
    }

    return QVariant(matches);
}

QVariant DatabaseList::remove(QVariant q) {
    QVariantMap query = q.toMap();
    QVariantList matches;
    beginResetModel();
    m_guard.lock();
    for ( int i = 0; i < m_objects.size(); ) {
        if ( _match(m_objects[i],query) ) {
            matches.append(QVariantMap({{"_id",m_objects[i]["_id"]}}));
            m_objects.removeAt(i);
        } else {
            i++;
        }
    }
    m_guard.unlock();
    endResetModel();
    /*
    if ( matches.size() > 0 ) {
        emit dataChanged(createIndex(0,0),createIndex(m_objects.size()-1,0));
        emit countChanged();
    }
    */
    return QVariant(matches);
}

QVariant DatabaseList::find(QVariant q) {
    QMutexLocker locker(&m_guard);
    QVariantMap query = q.toMap();
    QVariantList matches;
    int count = m_objects.size();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_objects[i],query) ) {
            matches.append(m_objects[i]);
        }
    }
    return QVariant(matches);
}

QVariant DatabaseList::findOne(QVariant q) {
    QMutexLocker locker(&m_guard);
    QVariantMap query = q.toMap();
    QVariantList matches;
    int count = m_objects.size();
    for ( int i = 0; i < count; i++ ) {
        if ( _match(m_objects[i],query) ) {
            return QVariant(m_objects[i]);
        }
    }
    return QVariant();
}

QVariant DatabaseList::get(int i) {
    QMutexLocker locker(&m_guard);
    if ( i >= 0 && i < m_objects.size() ) {
        return QVariant(m_objects[i]);
    }
    return QVariant();
}

void DatabaseList::sortBy(QVariant s) {
    if ( m_sort != s ) {
        m_sort = s.toMap();
        beginResetModel();
        m_guard.lock();
        _sort();
        m_guard.unlock();
        endResetModel();
        //emit dataChanged(createIndex(0,0),createIndex(m_objects.size()-1,0));
    }
}
//
//
//
void DatabaseList::findAsync(QVariant q) {
    QString operation = "find";
    //QMetaMethod method = this->metaObject()->method(this->metaObject()->indexOfMethod("find(QVariant)"));
    emit asyncOperation(this,operation,q);
}
void DatabaseList::addManyAsync(QVariant entries) {
    QString operation = "addMany";
    emit asyncOperation(this,operation,entries);
}

void DatabaseList::updateAsync(QVariant q,QVariant u) {
    QString operation = "update";
    QVariantMap parameters;
    parameters["query"] = q;
    parameters["update"] = u;
    emit asyncOperation(this,operation,QVariant(parameters));
}

//
//
//
void DatabaseList::beginBatch() {
    QMutexLocker locker(&m_guard);
    beginResetModel();
}
QVariant DatabaseList::batchAdd(QVariant o) {
    QMutexLocker locker(&m_guard);
    QVariantMap object = o.toMap();
    if ( !object.contains("_id") ) {
        object["_id"] = QUuid::createUuid().toString();
    }
    m_objects.append(object);
    QVariantMap id;
    id["_id"] = object["_id"];
    return QVariant(id);
}
void DatabaseList::endBatch() {
    QMutexLocker locker(&m_guard);
    _sort();
    endResetModel();
}
//
//
//
void DatabaseList::_sort() {
    if ( !m_sort.empty() ) {
        QString field = m_sort.firstKey();
        int direction = m_sort.first().value<int>();
        qDebug() << "sorting by : " << field << " direction : " << direction;
        std::sort(m_objects.begin(),m_objects.end(),[&field,&direction](const QVariantMap& a, const QVariantMap& b) -> bool {
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
bool DatabaseList::_match( QVariantMap& object, QVariantMap& query ) {
    for ( QVariantMap::iterator it = query.begin(); it != query.end(); ++it ) {
        if ( !object.contains(it.key()) || object[ it.key() ] != query[ it.key() ] ) return false;
    }
    return true;
}
void DatabaseList::_update( QVariantMap& object, QVariantMap& update ) {
    for ( QVariantMap::iterator it = update.begin(); it != update.end(); ++it ) {
        //
        // TODO: handle nested array updates
        //
        object[ it.key() ] = it.value();
    }
}
QString DatabaseList::_path() {
    return SystemUtils::shared()->documentDirectory().append("/").append(m_collection).append(".json");
}
