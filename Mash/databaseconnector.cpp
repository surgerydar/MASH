#include "databaseconnector.h"
#include "asyncdatabase.h"

DatabaseConnector::DatabaseConnector(QObject *parent) : QObject(parent) {
    AsyncDatabase* database = AsyncDatabase::shared();
    connect(database,&AsyncDatabase::success,this,&DatabaseConnector::success,Qt::QueuedConnection);
    connect(database,&AsyncDatabase::error,this,&DatabaseConnector::error,Qt::QueuedConnection);
}
