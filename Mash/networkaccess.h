#ifndef NETWORKACCESS_H
#define NETWORKACCESS_H

#include <QObject>
#include <QNetworkAccessManager>

class NetworkAccess : public QObject
{
    Q_OBJECT
public:
    explicit NetworkAccess(QObject *parent = 0);
    static NetworkAccess* shared();
    //
    //
    //
    QNetworkAccessManager* net() { return m_net; }
    bool isAccessible() { return m_accesible; }
signals:

public slots:

private slots:
    void replyFinished(QNetworkReply* reply);
    void accesibleChanged(QNetworkAccessManager::NetworkAccessibility accessible);
private:
    static NetworkAccess* s_shared;
    QNetworkAccessManager* m_net;
    bool m_accesible;
};

#endif // NETWORKACCESS_H
