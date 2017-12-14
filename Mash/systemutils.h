#ifndef SYSTEMUTILS_H
#define SYSTEMUTILS_H

#include <QObject>
#include <QThread>


class SystemUtils : public QObject
{
    Q_OBJECT
public:
    explicit SystemUtils(QObject *parent = 0);
    static SystemUtils* shared();
private:
    static SystemUtils* s_shared;

signals:
    void installProgress( float progress );
    void installComplete();
    void installError( QString error );

public slots:
    bool isFirstRun();
    void install();
    //
    //
    //
    QString applicationDirectory();
    QString documentDirectory();
    QString temporaryDirectory();

private slots:
    //
    //
    //
    void _installComplete();
    void _installError(QString& error);
};

#endif // SYSTEMUTILS_H
