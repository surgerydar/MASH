#include <QFile>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonObject>
#include <QVariantMap>
#include <QVariantList>
#include <QUuid>
#include <QDebug>
#include <QNetworkReply>
#include "webchannel.h"

/*
 * example JSON response
 * {"status":"OK|ERROR", "message":"Optional error message", "data":[{"_id":"59769395ce9a1c48072c3ad6","mash":{"type":"text","content":"hello"},"time":1500943253355},{"_id":"59769395ce9a1c48072c3ad6","mash":{"type":"image","content":"http://host/image.jpg"},"time":1500943253355}...] }
 */

WebChannel::WebChannel(QObject *parent) : QObject(parent) {
    m_net = new QNetworkAccessManager(this);
    connect(m_net, &QNetworkAccessManager::finished, this, &WebChannel::replyFinished);
}
//
// public slots
//
void WebChannel::get( const QString& command, const QVariant& parameters ) {
    QVariantList _parameters = parameters.toList();
    _get(command,_parameters);
}
void WebChannel::put( const QString& command, const QVariant& parameters, const QVariant& data ) {
    QVariantList _parameters = parameters.toList();
    QVariantMap _data = data.toMap();
    _put(command,_parameters,_data);
}
void WebChannel::post( const QString& command, const QVariant& parameters, const QVariant& data ) {
    QVariantList _parameters = parameters.toList();
    QVariantMap _data = data.toMap();
    _post(command,_parameters,_data);
}
void WebChannel::del( const QString& command, const QVariant& parameters ) {
    QVariantList _parameters = parameters.toList();
    _delete(command,_parameters);
}
//
// private slots
//
void WebChannel::replyFinished(QNetworkReply* reply) {
    qDebug() << "WebChannel::replyFinished()";
    QString command = reply->url().path();
    QVariant payload;
    QString status;
    QString message;
    bool ok = false;
    if ( reply->error() == QNetworkReply::NoError ) {
        //
        // parse JSON
        //
        QByteArray json = reply->readAll();
        QJsonDocument doc = QJsonDocument::fromJson(json);
        QJsonObject response = doc.object();
        if ( !response.isEmpty() ) {
            status = response.value("status").toString();
            if ( status == "OK" ) {
                ok = true;
                QJsonValue data = response.value("data");
                if ( data.isObject() ) {
                    QJsonObject object = data.toObject();
                    payload = QVariant::fromValue(object.toVariantMap());
                } else if ( data.isArray() ) {
                    QJsonArray array = data.toArray();
                    payload = QVariant::fromValue(array.toVariantList());
                } else {
                    message = data.toString();
                }
            } else if ( status == "ERROR" ) {
                message = response.value("message").toString();
                if ( message.length() > 0 ) {
                    qDebug() << "WebChannel::replyFinished : error : " << message;
                } else {

                    qDebug() << "WebChannel::replyFinished : empty error";
                }
            } else {
                message = "Unknown Status";
                qDebug() << "WebChannel::replyFinished : unknown status : " << status;
            }
        } else {
            message = "Empty Response";
            qDebug() << "WebChannel : error : empty response";
            qDebug() << json;
        }
    } else {
        message = reply->errorString();
        qDebug() << "WebChannel error : " << message;
    }
    if ( ok ) {
        emit success( command, payload );
    } else {
        emit error( command, message );
    }
}
//
//
//
void WebChannel::_get( const QString& command, const QVariantList& parameters ) {
    send( HTTP_GET, command, parameters );
}

void WebChannel::_put( const QString& command, const QVariantList& parameters, const QVariantMap& data ) {
    QString payload = formatPayload(data);
    send( HTTP_PUT, command, parameters, payload );
}

void WebChannel::_post( const QString& command, const QVariantList& parameters, const QVariantMap& data ) {
    QString payload = formatPayload(data);
    send( HTTP_POST, command, parameters, payload );
}

void WebChannel::_delete( const QString& command, const QVariantList& parameters ) {
    send( HTTP_DELETE, command, parameters );
}

void WebChannel::send( const HTTPMethod method, const QString& command, const QVariantList& parameters, const QString& data ) {
    //
    // build REST endpoint
    //
    QString endpoint = m_url;
    endpoint += '/';
    endpoint += command;
    endpoint += formatParameters(parameters);
    qDebug() << "WebChannel::send : endpoint : " << endpoint;
    QUrl url = QUrl(endpoint);
    //
    // build request
    //
    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::UserAgentHeader, "MASH v0.3");
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    QByteArray _data;
    if ( data.length() > 0 ) {
        _data = data.toUtf8();
        request.setHeader(QNetworkRequest::ContentLengthHeader,(int)_data.length());
    }
    //
    // send request
    //
    switch ( method ) {
    case HTTP_GET :
        m_net->get(request);
        break;
    case HTTP_PUT :
        m_net->put(request,_data);
        break;
    case HTTP_POST :
        m_net->post(request,_data);
        break;
    case HTTP_DELETE :
        m_net->deleteResource(request);
        break;
    }
}

QString WebChannel::formatParameters( const QVariantList& parameters ) {
    if ( parameters.size() == 0 ) return "";
    QString parameterString;
    for ( auto& parameter : parameters ) {
        parameterString += "/";
        parameterString += parameter.toString();
    }
    return parameterString;
}

QString WebChannel::formatPayload( const QVariantMap& data ) {
    QJsonDocument doc;
    doc.setObject(QJsonObject::fromVariantMap(data));
    return doc.toJson(QJsonDocument::Compact);
}

