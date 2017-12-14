#ifndef ASYNCDATABASE_H
#define ASYNCDATABASE_H

#include <QObject>
#include <QThread>
#include <QMutex>
#include <QVariant>
#include <QVariantMap>
#include <QList>
#include <QMutex>

class AsyncDatabase : public QObject
{
    Q_OBJECT
    Q_ENUMS(Operation)
    Q_PROPERTY(qreal latest MEMBER m_latest)
public:
    //
    //
    //
    enum Operation { Load, Save, Clear, Add, AddMany, Update, Remove, Find, FindOne, Get, Sort, Sync };
    Q_ENUM(Operation)
    //
    //
    //
    explicit AsyncDatabase(QObject *parent = 0);
    ~AsyncDatabase();
    //
    //
    //
    static AsyncDatabase* shared();
signals:
    //
    //
    //
    void success(Operation operation,QVariant result);
    void error(Operation operation,QString error);
    //
    //
    //
public slots:
    //
    //
    //
    void load();
    void save();
    //
    //
    //
    void clear();
    void add(QVariant o);
    void addMany(QVariant documents);
    void update(QVariant query,QVariant document);
    void remove(QVariant query);
    void find(QVariant query, QVariant sort, int limit);
    void findOne(QVariant query);
    void get(int i);
    void sort(QVariant order);
    void sync(QVariant documents);
    //
    //
    //
private:
    //
    //
    //
    QThread m_thread;
    QMutex  m_guard;
    //
    //
    //
    qreal               m_latest;
    QList<QVariantMap>  m_documents;
    QVariantMap         m_sort;
    //
    //
    //
    void convertDocumentToMash( QVariantMap& document, QVariantMap& mash );
    QVariantMap _findOne(QVariantMap query);
    void _sort();
    void __sort(QList<QVariantMap>& list,QVariantMap& s);
    bool _match( QVariantMap& object, QVariantMap& query );
    bool _matchList( QVariantMap& object, const QString& selector, QVariantList& list );
    void _update( QVariantMap& object, QVariantMap& update );
    QString _path();
    //
    //
    //
    static AsyncDatabase* s_shared;
};

#endif // ASYNCDATABASE_H
