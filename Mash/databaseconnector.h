#ifndef DATABASECONNECTOR_H
#define DATABASECONNECTOR_H

#include <QObject>
#include "asyncdatabase.h"

class DatabaseConnector : public QObject
{
    Q_OBJECT
public:
    explicit DatabaseConnector(QObject *parent = 0);

signals:
    //
    //
    //
    void success(AsyncDatabase::Operation operation,QVariant result);
    void error(AsyncDatabase::Operation operation,QString error);

public slots:
};

#endif // DATABASECONNECTOR_H
