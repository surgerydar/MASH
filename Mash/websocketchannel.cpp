#include <QVariant>
#include <QVariantMap>
#include <QUuid>
#include <QJsonDocument>
#include <QJsonObject>
#include <QDebug>
#include "websocketchannel.h"
//
//
//
WebSocketChannel::WebSocketChannel(QObject *parent) : QObject(parent) {
    connect(&m_webSocket, &QWebSocket::connected, this, &WebSocketChannel::connected);
    connect(&m_webSocket, &QWebSocket::disconnected, this, &WebSocketChannel::disconnected);
    connect(&m_webSocket, &QWebSocket::textMessageReceived, this, &WebSocketChannel::textMessageReceived);
    connect(&m_webSocket, static_cast<void (QWebSocket::*)(QAbstractSocket::SocketError)>(&QWebSocket::error), this, &WebSocketChannel::socketError);
}

void WebSocketChannel::open() {
    m_webSocket.open(m_url);
}

void WebSocketChannel::close() {
    m_webSocket.close();
}

QString WebSocketChannel::send(QVariant command) {
    if ( m_webSocket.state() == QAbstractSocket::UnconnectedState ) {
        qDebug() << "WebSocketChannel:send : error : not connected to : " << m_url;
        emit error("not connected");
        return "";
    }
    QVariantMap object = command.value<QVariantMap>();
    //
    // generate GUID for command
    //
    QString guid = QUuid::createUuid().toString();
    object["guid"] = guid;
    //
    // convert to JSON
    //
    QJsonDocument doc;
    doc.setObject(QJsonObject::fromVariantMap(object));
    QString message = doc.toJson();
    m_webSocket.sendTextMessage(message);
    //
    //
    //
    return guid;
}

void WebSocketChannel::connected() {
    qDebug() << "WebSocketChannel:connected";
    emit opened();
}

void WebSocketChannel::disconnected() {
    qDebug() << "WebSocketChannel:disconnected";
    emit closed();
    if ( m_autoreconnect ) {
        open();
    }
}

void WebSocketChannel::textMessageReceived(const QString& message) {
    qDebug() << "WebSocketChannel:textMessageReceived : ";
    emit received(message);
}

void WebSocketChannel::socketError(QAbstractSocket::SocketError err) {
    QString errorText( "socket error : ");
    switch( err ) {
    case QAbstractSocket::ConnectionRefusedError :
        errorText.append("ConnectionRefusedError");
        break;
    case QAbstractSocket::RemoteHostClosedError  :
        errorText.append("RemoteHostClosedError");
        break;
    case QAbstractSocket::HostNotFoundError :
        errorText.append("HostNotFoundError");
        break;
    case QAbstractSocket::SocketAccessError :
        errorText.append("SocketAccessError");
        break;
    case QAbstractSocket::SocketResourceError :
        errorText.append("SocketResourceError");
        break;
    case QAbstractSocket::SocketTimeoutError :
        errorText.append("SocketTimeoutError");
        break;
    case QAbstractSocket::DatagramTooLargeError :
        errorText.append("DatagramTooLargeError");
        break;
    case QAbstractSocket::NetworkError :
        errorText.append("NetworkError");
        break;
    case QAbstractSocket::AddressInUseError :
        errorText.append("AddressInUseError");
        break;
    case QAbstractSocket::SocketAddressNotAvailableError :
        errorText.append("SocketAddressNotAvailableError");
        break;
    case QAbstractSocket::UnsupportedSocketOperationError :
        errorText.append("UnsupportedSocketOperationError");
        break;
    case QAbstractSocket::UnfinishedSocketOperationError :
        errorText.append("UnfinishedSocketOperationError");
        break;
    case QAbstractSocket::ProxyAuthenticationRequiredError :
        errorText.append("ProxyAuthenticationRequiredError");
        break;
    case QAbstractSocket::SslHandshakeFailedError :
        errorText.append("SslHandshakeFailedError");
        break;
    case QAbstractSocket::ProxyConnectionRefusedError :
        errorText.append("ProxyConnectionRefusedError");
        break;
    case QAbstractSocket::ProxyConnectionClosedError :
        errorText.append("ProxyConnectionClosedError");
        break;
    case QAbstractSocket::ProxyConnectionTimeoutError :
        errorText.append("ProxyConnectionTimeoutError");
        break;
    case QAbstractSocket::ProxyNotFoundError :
        errorText.append("ProxyNotFoundError");
        break;
    case QAbstractSocket::ProxyProtocolError :
        errorText.append("ProxyProtocolError");
        break;
    case QAbstractSocket::OperationError :
        errorText.append("OperationError");
        break;
    case QAbstractSocket::SslInternalError :
        errorText.append("SslInternalError");
        break;
    case QAbstractSocket::SslInvalidUserDataError :
        errorText.append("SslInvalidUserDataError");
        break;
    case QAbstractSocket::TemporaryError :
        errorText.append("TemporaryError");
        break;
    default:
        errorText.append("Unknown error");
    }
    QString socketErrorString = m_webSocket.errorString();
    if ( socketErrorString.length() > 0 ) {
        errorText.append(" : ");
        errorText.append( socketErrorString );
    }
    emit error(errorText);
}
