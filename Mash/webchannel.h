#ifndef WebChannel_H
#define WebChannel_H

#include <QObject>
#include <QJsonObject>
#include <QVariant>
#include <QNetworkAccessManager>

class WebChannel : public QObject
{
    Q_OBJECT
    //
    // properties
    //
    Q_PROPERTY(QString url MEMBER m_url )
    //
    //
    //
public:
    explicit WebChannel(QObject *parent = 0);
signals:
    void success( QString command, QVariant result );
    void error( QString command, QString error );
public slots:
    void get( const QString& command, const QVariant& parameters = QVariant() );
    void put( const QString& command, const QVariant& parameters, const QVariant& data );
    void post( const QString& command, const QVariant& parameters, const QVariant& data );
    void del( const QString& command, const QVariant& parameters );
private slots:
    void replyFinished(QNetworkReply* reply);
private:
    enum HTTPMethod {
        HTTP_GET,
        HTTP_PUT,
        HTTP_POST,
        HTTP_DELETE
    };
    //
    //
    //
    void _get( const QString& command, const QVariantList& parameters );
    void _put( const QString& command, const QVariantList& parameters, const QVariantMap& data );
    void _post( const QString& command, const QVariantList& parameters, const QVariantMap& data );
    void _delete( const QString& command, const QVariantList& parameters );
    QString formatParameters( const QVariantList& parameters );
    QString formatPayload( const QVariantMap& data );
    void send( const HTTPMethod method, const QString& command, const QVariantList& parameters, const QString& payload = QString() );
    //
    //
    //
    QNetworkAccessManager*  m_net;
    QString                 m_url;
};

#endif // WebChannel_H
