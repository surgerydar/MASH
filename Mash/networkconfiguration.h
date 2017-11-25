#ifndef NETWORKCONFIGURATION_H
#define NETWORKCONFIGURATION_H

#include <QObject>
#include <QVariant>
#include <QNetworkConfigurationManager>

class NetworkConfiguration : public QObject
{
    Q_OBJECT
public:
    explicit NetworkConfiguration(QObject *parent = 0);
    static NetworkConfiguration* shared();
signals:
    void configurationListUpdated( QVariant list );
public slots:
    void update();
private slots:
    void updateCompleted();
    void onlineStateChanged(bool online);
private:
    static NetworkConfiguration* s_shared;
    QNetworkConfigurationManager m_manager;
    //
    //
    //
    QString descriptionFromState( QNetworkConfiguration::StateFlags state );
};

#endif // NETWORKCONFIGURATION_H
