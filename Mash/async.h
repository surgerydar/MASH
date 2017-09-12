#ifndef ASYNC_H
#define ASYNC_H

#include <QObject>
#include <QVariant>
#include <QMutex>
#include <QDebug>
//
//
//
class DatabaseList;

class Async : public QObject
{
    Q_OBJECT
public:
    explicit Async(QObject *parent = 0);

public slots:
    void performOperation(DatabaseList* database, QString operation, QVariant parameters);

signals:
    void asyncResult(QString operation, QString status, QVariant result );

private:
    QMutex m_guard;
};
#endif // ASYNC_H
