#ifndef GUIDGENERATOR_H
#define GUIDGENERATOR_H

#include <QObject>

class GUIDGenerator : public QObject
{
    Q_OBJECT
public:
    explicit GUIDGenerator(QObject *parent = 0);
    static GUIDGenerator* shared();
signals:

public slots:
    QString generate();
private:
    static GUIDGenerator* s_shared;
};

#endif // GUIDGENERATOR_H
