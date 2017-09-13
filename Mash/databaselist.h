#ifndef DATABASELIST_H
#define DATABASELIST_H

#include <QAbstractListModel>
#include <QList>
#include <QVariant>
#include <QVariantMap>
#include <QThread>
#include <QMutex>

class DatabaseList : public QAbstractListModel
{
    Q_OBJECT
    //
    //
    //
    Q_PROPERTY(QString collection MEMBER m_collection )
    Q_PROPERTY(int count READ rowCount NOTIFY countChanged)
    Q_PROPERTY(QStringList roles MEMBER m_roles )
    Q_PROPERTY(QVariantMap sort MEMBER m_sort )
    Q_PROPERTY(unsigned long latest MEMBER m_latest)
    //
    //
    //
public:
    explicit DatabaseList(QObject *parent = 0);
    ~DatabaseList();
    //
    // QAbstractListModel overrides
    //
    QHash<int, QByteArray> roleNames() const override;
    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role = Qt::DisplayRole) const override;
    //
    //
    //
signals:
    //
    //
    //
    void countChanged();
    void sortChanged();
    void error(QString operation,QString error);
    //
    //
    //
    void asyncResult( QString operation, QString status, QVariant result );
    void asyncOperation( DatabaseList* object, QString operation, QVariant parameters );

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
    QVariant add(QVariant o);
    QVariant addMany(QVariant entries);
    QVariant update(QVariant q,QVariant u);
    QVariant remove(QVariant q);
    QVariant find(QVariant q);
    QVariant findOne(QVariant q);
    QVariant get(int i);
    void sortBy(QVariant s);
    //
    //
    //
    void findAsync(QVariant q);
    void addManyAsync(QVariant entries);
    void updateAsync(QVariant q,QVariant u);
    //
    //
    //
    void beginBatch();
    QVariant batchAdd(QVariant o);
    void endBatch();
    //
    //
    //
private slots:
    //
    //
    //
private:
    QString             m_collection;
    QStringList         m_roles;
    QVariantMap         m_sort;
    unsigned long       m_latest;
    QList<QVariantMap>  m_objects;
    QThread             m_asyncThread;
    QMutex              m_guard;
    //
    //
    //
    void _sort();
    bool _match( QVariantMap& object, QVariantMap& query );
    void _update( QVariantMap& object, QVariantMap& update );
    QString _path();
};

#endif // DATABASELIST_H
