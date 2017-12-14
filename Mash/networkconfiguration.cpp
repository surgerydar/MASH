#include <QNetworkConfiguration>
#include <QDebug>
#include <QNetworkConfigurationManager>

#include "networkconfiguration.h"

NetworkConfiguration* NetworkConfiguration::s_shared = nullptr;

NetworkConfiguration::NetworkConfiguration(QObject *parent) : QObject(parent), m_manager(this) {
    connect( &m_manager, &QNetworkConfigurationManager::updateCompleted, this, &NetworkConfiguration::updateCompleted );
    connect( &m_manager, &QNetworkConfigurationManager::onlineStateChanged, this, &NetworkConfiguration::onlineStateChanged );
}

NetworkConfiguration* NetworkConfiguration::shared() {
    if ( s_shared == nullptr ) {
        s_shared = new NetworkConfiguration;
    }
    return s_shared;
}

void NetworkConfiguration::update() {
    m_manager.updateConfigurations();
}
//
// private slots
//
void NetworkConfiguration::updateCompleted() {
    qDebug() << "NetworkConfiguration::updateCompleted";
    QList<QNetworkConfiguration> configurations = m_manager.allConfigurations();
    for ( auto& configuration : configurations ) {
        QString name                                    = configuration.name();
        QNetworkConfiguration::BearerType bearerType    = configuration.bearerType();
        QString bearerTypeName                          = configuration.bearerTypeName();
        QNetworkConfiguration::StateFlags state         = configuration.state();
        qDebug() << "configuration:" << name << ":" << bearerType << ":" << bearerTypeName << ":" << state << " = (" << descriptionFromState( state ) << ")";
        QList<QNetworkConfiguration> childConfigurations = configuration.children();
        for ( auto& childConfiguration : childConfigurations ) {
            name            = childConfiguration.name();
            bearerType      = childConfiguration.bearerType();
            bearerTypeName  = childConfiguration.bearerTypeName();
            state           = childConfiguration.state();
            qDebug() << "child configuration:" << name << ":" << bearerType << ":" << bearerTypeName << ":" << state << " = (" << descriptionFromState( state ) << ")";
        }
    }
}
void NetworkConfiguration::onlineStateChanged(bool online) {
    qDebug() << "NetworkConfiguration::onlineStateChanged : " << ( online ? "online" : "offline");
}
//
// private utilities
//
QString NetworkConfiguration::descriptionFromState( QNetworkConfiguration::StateFlags state ) {
    QString description;

    if ( ( state & QNetworkConfiguration::Undefined ) == QNetworkConfiguration::Undefined ) {
        description += "Undefined ";
    }
    if ( ( state & QNetworkConfiguration::Defined ) == QNetworkConfiguration::Defined ) {
        description += "Defined ";
    }
    if ( ( state & QNetworkConfiguration::Discovered ) == QNetworkConfiguration::Discovered ) {
        description += "Descovered ";
    }
    if ( ( state & QNetworkConfiguration::Active ) == QNetworkConfiguration::Active ) {
        description += "Active ";
    }
    return description.trimmed();
}
