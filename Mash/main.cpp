#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include "webchannel.h"
#include "asyncdatabase.h"
#include "databaseconnector.h"
#include "websocketchannel.h"

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
    qmlRegisterType<WebChannel>("SodaControls", 1, 0, "WebChannel");
    qmlRegisterType<AsyncDatabase>("SodaControls", 1, 0, "AsyncDatabase");
    qmlRegisterType<WebSocketChannel>("SodaControls", 1, 0, "WebSocketChannel");
    //
    //
    //
    engine.rootContext()->setContextProperty("Database", AsyncDatabase::shared());
    engine.rootContext()->setContextProperty("DatabaseConnector", new DatabaseConnector);
    //
    //
    //
    engine.load(QUrl(QLatin1String("qrc:/main.qml")));
    //
    //
    //
    return app.exec();
}
