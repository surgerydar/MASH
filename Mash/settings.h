#ifndef SETTINGS_H
#define SETTINGS_H

#include <QObject>
#include <QString>
#include <QVariantMap>

class Settings : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString file MEMBER m_file)
public:
    explicit Settings(QObject *parent = 0);
    static Settings* shared();

signals:

public slots:
    void load();
    void save();
    void set( QString key, QString value );
    QString get( QString key );
    void remove( QString key );
private:
    static Settings* s_shared;
    QString     m_file;
    QVariantMap m_settings;
};

#endif // SETTINGS_H
