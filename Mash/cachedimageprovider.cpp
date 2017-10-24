#include <QUuid>
#include <QDir>
#include <QDebug>
#include <QVariantMap>
#include <QJsonDocument>
#include <QJsonObject>
#include <QImageReader>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QNetworkAccessManager>
#include "cachedimageprovider.h"
#include "systemutils.h"
#include "networkaccess.h"

class CachedImageResponse : public QQuickImageResponse, public QRunnable
{
    public:
        CachedImageResponse(const QString &id, const QSize &requestedSize) :
            m_id(id),
            m_requestedSize(requestedSize) {
            setAutoDelete(false);
        }

        QQuickTextureFactory *textureFactory() const {
            return QQuickTextureFactory::textureFactoryForImage(m_image);
        }
        //
        //
        //
        void run() {
            //
            // check for image in local cache
            //
            QString localPath = CachedImageProvider::cacheLocation(m_id);
            if ( localPath.length() > 0 ) {
                QFile file(localPath);
                if(file.open(QFile::ReadOnly)) {
                    //qDebug() << "CachedImageResponse : loading cached image data : " << localPath;
                    QByteArray buffer;
                    while (!file.atEnd()) {
                        QByteArray chunk = file.read(512);
                        if ( chunk.size() > 0 ) {
                            buffer.append(chunk);
                            QThread::yieldCurrentThread();
                        }
                    }
                    //qDebug() << "CachedImageResponse : cached image data loaded";
                    m_image.loadFromData(buffer);
                    //qDebug() << "CachedImageResponse : cached image loaded from data";
                    if ( !m_image.isNull() ) {
                        finish();
                        return;
                    } else {
                        qDebug() << "CachedImageResponse : error loading cached image : " << localPath;
                    }
                } else {
                    qDebug() << "CachedImageResponse : error loading cached image : " << localPath;
                }

            }
            //
            //
            //
            //qDebug() << "CachedImageResponse : loading image from network : " << m_id;
            QNetworkAccessManager net;
            QEventLoop loop;
            connect(&net, &QNetworkAccessManager::finished, [this,&loop]( QNetworkReply* reply ) {
                this->replyFinished(reply);
                loop.quit();
            });
            //
            // load image from network
            //
            QUrl url = QUrl(m_id);
            QNetworkRequest request(url);
            request.setHeader(QNetworkRequest::UserAgentHeader, "MASH v0.3");
            net.get(request);
            loop.exec();
        }

        void finish() {
            if (m_requestedSize.isValid()) {
                //qDebug() << "CachedImageResponse : resizing image";
                m_image = m_image.scaled(m_requestedSize, Qt::KeepAspectRatio);
                //qDebug() << "CachedImageResponse : image resized";
            }
            emit finished();
        }

private slots:
        void replyFinished(QNetworkReply* reply) {
            qDebug() << "CachedImageResponse : reply : " << reply->request().url();
            if ( reply->error() == QNetworkReply::NoError ) {
                QByteArray data = reply->readAll();
                m_image.loadFromData(data);
                if ( !m_image.isNull() ) {
                    QString filename = QDateTime::currentDateTime().toString("yyyy-MM-dd-HH-mm-ss-zzz.png");
                    QString filepath = CachedImageProvider::cachePath().append("/").append(filename);
                    m_image.save(filepath);
                    CachedImageProvider::addCacheLocation(m_id,filename);
                    finish();
                } else {
                   m_errorString = "Invalid image format";
                }
            } else {
                m_errorString = reply->errorString();
                //
                // TODO: handle content errors - possibly remove from database if gone type error
                //
                qDebug() << "CachedImageResponse error : " << reply->error() << " : " << reply->errorString();
            }
            reply->deleteLater();
        }

private:
        QString m_id;
        QSize   m_requestedSize;
        QImage  m_image;
        QString m_errorString;
};

QVariantMap CachedImageProvider::s_cache;
const QString cacheDirectoryName( "mash-cache" );

CachedImageProvider::CachedImageProvider() : QQuickAsyncImageProvider() {
    if( s_cache.isEmpty() ) {
        QDir cacheDirectory( cachePath() );
        if ( !cacheDirectory.exists() ) {
            cacheDirectory.cdUp();
            if ( !cacheDirectory.mkdir(cacheDirectoryName) ) {
                qDebug() << "CachedImageProvider : error : unable to create cache directory : " << cachePath();
            }
        } else {
            load();
        }
    }
}

void CachedImageProvider::addCacheLocation(QString&id,QString&location) {
    s_cache[ id ] = QVariant::fromValue(location);
    save();
}

QString CachedImageProvider::cacheLocation(QString&id) {
    QString location;
    if( s_cache.contains(id) ) {
        location = cachePath().append("/").append(s_cache[id].toString());
    } else {
        qDebug() << "CachedImageProvider : image not cached : " << id;
    }
    return location;
}

QString CachedImageProvider::cachePath() {
    return SystemUtils::shared()->documentDirectory().append("/").append(cacheDirectoryName);
}

void CachedImageProvider::load() {
    QFile cacheFile( cachePath().append("/cache.json") );
    if( cacheFile.open(QIODevice::ReadOnly) ) {
        //
        // read
        //
        QByteArray data = cacheFile.readAll();
        //
        // parse
        //
        QJsonParseError parseError;
        QJsonDocument document( QJsonDocument::fromJson(data, &parseError) );
        //
        // interpret
        //
        if ( document.isObject() ) {
            s_cache = document.object().toVariantMap();
            qDebug() << "CachedImageProvider : loaded";
            for ( auto& key : s_cache ) {
                qDebug() << key;
            }
        } else {
            QString error = "CachedImageProvider : error parsing : ";
            error.append( parseError.errorString() );
            qDebug() << error;
        }
    } else {
        QString error = "CachedImageProvider : Unable to open file : ";
        error.append(cachePath().append("/cache.json"));
        qDebug() << error;
    }
}

void CachedImageProvider::save() {
    //
    // open
    //
    QFile jsonFile(cachePath().append("/cache.json"));
    if (jsonFile.open(QIODevice::WriteOnly)) {
        QJsonDocument document;
        document.setObject(QJsonObject::fromVariantMap(s_cache));
        QByteArray json = document.toJson();
        jsonFile.write(json);
    } else {
        QString error = "Unable to open file : ";
        error.append(cachePath().append("/cache.json"));
        qDebug() << error;
    }
}

/*
 * set
 * source: "image://cached/http://1.bp.blogspot.com/-xjwMlzM_yLY/UfcfbmyQUzI/AAAAAAAAAEs/tPUjcbpGav0/s320/embersToAshes2.png"
 *
 */
QQuickImageResponse* CachedImageProvider::requestImageResponse(const QString &id, const QSize &requestedSize) {
    qDebug() << "requested id : " << id;
    CachedImageResponse *response = new CachedImageResponse(id, requestedSize);
    m_pool.start(response);
    return response;
}
