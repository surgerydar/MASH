#include <QFile>
#include <QByteArray>

#include "effect.h"

Effect::Effect(QObject *parent) : QObject(parent) {
    QFile common(":/shaders/common.frag");
    if ( common.open(QFile::ReadOnly) ) {
        QByteArray data  = common.readAll();
        m_common = data;
    }
}

QString Effect::load( QString name ) {
    QFile shaderFile(name);
    if ( shaderFile.open(QFile::ReadOnly) ) {
        QByteArray data  = shaderFile.readAll();
        QString shader = m_common;
        shader.append(data);
        return shader;
    }
    return "";
}
