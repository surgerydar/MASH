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
            m_net = new QNetworkAccessManager(this);
            connect(m_net, &QNetworkAccessManager::finished, this, &CachedImageResponse::replyFinished);
        }

        QQuickTextureFactory *textureFactory() const {
            return QQuickTextureFactory::textureFactoryForImage(m_image);
        }

        void run() {
            //
            // check for image in local cache
            //
            QString localPath = CachedImageProvider::cacheLocation(m_id);
            if ( localPath.length() > 0 ) {
                m_image.load(localPath);
                if ( !m_image.isNull() ) {
                    finish();
                    return;
                }
            }
            //
            // load image from network
            //
            qDebug() << "CachedImageResponse : loading image : " << m_id;
            QUrl url = QUrl(m_id);
            QNetworkRequest request(url);
            request.setHeader(QNetworkRequest::UserAgentHeader, "MASH v0.3");
            m_net->get(request);
            //while( m_image.isNull() ) QThread::sleep(1);
            /*
            QNetworkReply* reply = NetworkAccess::shared()->net()->get(request);
            QImageReader reader(reply);
            m_image = reader.read();
            if ( m_image.isNull() ) {
                m_image = QImage(50, 50, QImage::Format_RGB32);
                m_image.fill(Qt::red);
            }
            finish();
            */
        }

        void finish() {
            if (m_requestedSize.isValid()) {
                m_image = m_image.scaled(m_requestedSize);
            }
            emit finished();
        }

private slots:
        void replyFinished(QNetworkReply* reply) {
            qDebug() << "CachedImageResponse : reply : " << reply->request().url();
            if ( reply->error() == QNetworkReply::NoError ) {
                //QImageReader reader(reply);
                //m_image = reader.read();
                if ( m_image.isNull() ) {
                    m_image = QImage(50, 50, QImage::Format_RGB32);
                    m_image.fill(Qt::red);
                }
                finish();
            } else {
                qDebug() << "CachedImageResponse error : " << reply->errorString();
            }
        }

private:
        QString m_id;
        QSize m_requestedSize;
        QImage m_image;
        QNetworkAccessManager* m_net;
};

QVariantMap CachedImageProvider::s_cache;
const QString cacheDirectoryName( "mash-cache" );

CachedImageProvider::CachedImageProvider() : QQuickAsyncImageProvider() {
    if( s_cache.isEmpty() ) {
        QDir cacheDirectory( cachePath() );
        if ( !cacheDirectory.exists() ) {
            cacheDirectory.cdUp();
            cacheDirectory.mkdir(cacheDirectoryName);
        } else if ( !cacheDirectory.exists("cache.json") ) {
            load();
        }
    }
}

QString CachedImageProvider::cacheLocation(QString&id) {
    QString location;
    if( s_cache.contains(id) ) {
        location = cachePath().append("/").append(s_cache[id].toString());
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
        if ( document.isObject() ){
            s_cache = document.toVariant().toMap();
        } else {
            QString error = "error parsing : ";
            error.append( parseError.errorString() );
            qDebug() << error;
        }
    } else {
        QString error = "Unable to open file : ";
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
