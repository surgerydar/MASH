#ifndef EFFECT_H
#define EFFECT_H

#include <QObject>

class Effect : public QObject
{
    Q_OBJECT
public:
    explicit Effect(QObject *parent = 0);

signals:

public slots:
    QString load( QString name );
private:
    QString m_common;
};

#endif // EFFECT_H
