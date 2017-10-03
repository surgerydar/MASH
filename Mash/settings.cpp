#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QFile>
#include <QIODevice>
#include <QByteArray>
#include <QJsonParseError>
#include <QDebug>
#include "settings.h"
#include "systemutils.h"

Settings* Settings::s_shared = nullptr;

Settings::Settings(QObject *parent) : QObject(parent) {
    m_file = "mash-settings.json";
}

Settings* Settings::shared() {
    if ( s_shared == nullptr ) {
        s_shared = new Settings;
    }
    return s_shared;
}

void Settings::load() {
    //
    // assume the path is relative to documents directory
    //
    QString fullpath = SystemUtils::shared()->documentDirectory().append("/").append(m_file);
    //
    // open
    //
    QFile jsonFile(fullpath);
    if (jsonFile.open(QIODevice::ReadOnly)) {
        //
        // read
        //
        QByteArray data = jsonFile.readAll();
        //
        // parse
        //
        QJsonParseError parseError;
        QJsonDocument document( QJsonDocument::fromJson(data, &parseError) );
        //
        // interpret
        //
        if ( document.isObject() ){
            m_settings = document.toVariant().toMap();
        } else {
            QString error = "error parsing : ";
            error.append( parseError.errorString() );
            qDebug() << error;
        }
    } else {
        QString error = "Unable to open file : ";
        error.append(fullpath);
        qDebug() << error;
    }
}

void Settings::save() {
    //
    // assume the path is relative to documents directory
    //
    QString fullpath = SystemUtils::shared()->documentDirectory().append("/").append(m_file);
    //
    // open
    //
    QFile jsonFile(fullpath);
    if (jsonFile.open(QIODevice::WriteOnly)) {
        QJsonDocument document;
        document.setObject(QJsonObject::fromVariantMap(m_settings));
        QByteArray json = document.toJson();
        jsonFile.write(json);
    } else {
        QString error = "Unable to open file : ";
        error.append(fullpath);
        qDebug() << error;
    }

}

void Settings::set( QString key, QString value ) {
    m_settings[key] = value;
}

QString Settings::get( QString key ) {
    if ( m_settings.contains(key) ) {
        return m_settings[key].toString();
    }
    return "";
}

void Settings::remove( QString key ) {
    m_settings.remove(key);
}
