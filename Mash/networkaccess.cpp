#include <QNetworkReply>
#include <QMetaObject>
#include <QDebug>
#include "networkaccess.h"

NetworkAccess* NetworkAccess::s_shared = nullptr;

NetworkAccess::NetworkAccess(QObject *parent) : QObject(parent) {
    m_net = new QNetworkAccessManager(this);
    connect(m_net, &QNetworkAccessManager::finished, this, &NetworkAccess::replyFinished);
}

NetworkAccess* NetworkAccess::shared() {
    if ( s_shared == nullptr ) {
        s_shared = new NetworkAccess;
    }
    return s_shared;
}

void NetworkAccess::replyFinished(QNetworkReply* reply) {
    qDebug() << "NetworkAccess : reply : " << reply->request().url();
    QObject* originator = reply->request().originatingObject();
    if ( originator ) {
        QMetaObject::invokeMethod( originator, "replyFinished", Qt::DirectConnection, Q_ARG(QNetworkReply*,reply) );
    }
}

void NetworkAccess::accesibleChanged(QNetworkAccessManager::NetworkAccessibility accessible) {
    m_accesible = accessible == QNetworkAccessManager::Accessible;
}
