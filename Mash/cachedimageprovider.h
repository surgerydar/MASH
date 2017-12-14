#ifndef CACHEDIMAGEPROVIDER_H
#define CACHEDIMAGEPROVIDER_H

#include <QQuickAsyncImageProvider>
#include <QVariantMap>
#include <QThreadPool>
#include <QNetworkAccessManager>
#include <QMutex>

class CachedImageProvider : public QQuickAsyncImageProvider
{
public:
    CachedImageProvider();
    QQuickImageResponse *requestImageResponse(const QString &id, const QSize &requestedSize);
    //
    //
    //
    static QString cacheLocation(QString&id);
    static void addCacheLocation(QString&id,QString&location);
    static QString cachePath();
private:
    static void load();
    static void save();

    static QVariantMap s_cache;

    static QMutex m_guard;
    QThreadPool m_pool;
};

#endif // CACHEDIMAGEPROVIDER_H
