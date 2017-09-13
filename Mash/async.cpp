#include "async.h"
#include "databaselist.h"

Async::Async(QObject *parent) : QObject(parent) {

}

void Async::performOperation(DatabaseList* database, QString operation, QVariant parameters) {
    QMutexLocker locker(&m_guard);

    QVariant result;
    qDebug() << "Async::performOperation : " << operation;
    /*
    if( method.invoke(object,Q_RETURN_ARG(QVariant, result), Q_ARG(QVariant, parameters) ) ) {
        emit asyncResult( operation, "OK", result);
    } else {
        emit asyncResult( operation, "ERROR", result );
    }
    */
    if ( operation == "find" ) {
        result = database->find(parameters);
        //
        // TODO: explicit find least viewed
        //
        QVariantList matches = result.toList();
        QVariantMap candidate;
        for ( QVariant& match : matches ) {
            QVariantMap matchMap = match.toMap();
            if ( candidate.isEmpty() || matchMap["views"] < candidate["views"] ) { // TODO: make this generic
                candidate = matchMap;
            }
        }
        //qDebug() << "Async : search : " << parameters.toMap() << " : found : "  << matches.size() << " : candidate : " << candidate;
        if ( candidate.size() > 0 ) {
            //
            // update view count
            //
            QVariantMap query({{"_id",candidate["_id"]}});
            QVariantMap update({{"views",candidate["views"].toInt() + 1}});
            database->update(query,update);
            //
            // return result
            //
            emit asyncResult( operation, "OK", QVariant(candidate));
        }
    } else if( operation == "addMany" ) {
        result = database->addMany(parameters);
        database->save();
        emit asyncResult( operation, "OK", result);
    } else if( operation == "update" ) {
        QVariantMap _parameters = parameters.toMap();
        QVariant query = _parameters["query"];
        QVariant update = _parameters["update"];
        qDebug() << "query : " << query.toMap() << " : update : " << update.toMap();
        result = database->update(query,update);
        QVariantList matches = result.toList();
        if ( matches.size() > 0 ) {
            database->save();
        }
        emit asyncResult( operation, "OK", result);
    }
}

