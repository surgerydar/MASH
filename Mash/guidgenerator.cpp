#include <QUuid>
#include "guidgenerator.h"

GUIDGenerator* GUIDGenerator::s_shared = nullptr;

GUIDGenerator::GUIDGenerator(QObject *parent) : QObject(parent) {

}

GUIDGenerator* GUIDGenerator::shared() {
    if ( !s_shared ) {
        s_shared = new GUIDGenerator();
    }
    return s_shared;
}

QString GUIDGenerator::generate() {
    return QUuid::createUuid().toString();
}


