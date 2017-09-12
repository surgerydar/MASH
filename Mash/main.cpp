#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include "webchannel.h"
#include "databaselist.h"

int main(int argc, char *argv[])
{
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
    QGuiApplication app(argc, argv);
    //
    //
    //
    QQmlApplicationEngine engine;
    //
    //
    //
    qDebug() << "Registering controls";
    qmlRegisterType<DatabaseList>("SodaControls", 1, 0, "DatabaseList");
    qmlRegisterType<WebChannel>("SodaControls", 1, 0, "WebChannel");
    //
    //
    //
    engine.load(QUrl(QLatin1String("qrc:/main.qml")));
    //
    //
    //
    return app.exec();
}
