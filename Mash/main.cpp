#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QCursor>
#include <QDebug>
#include "webchannel.h"
#include "asyncdatabase.h"
#include "databaseconnector.h"
#include "websocketchannel.h"
#include "compositeimage.h"
#include "guidgenerator.h"
#include "settings.h"
#include "cachedimageprovider.h"
#include "networkconfiguration.h"
#include "mashnoise.h"
#include "qr.h"

int main(int argc, char *argv[])
{
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);
    QGuiApplication app(argc, argv);
    //
    // hide cursor
    //
    QCursor blankCursor( Qt::BlankCursor );
    app.setOverrideCursor(blankCursor);
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
    qmlRegisterType<CompositeImage>("SodaControls", 1, 0, "CompositeImage");
    //
    //
    //
    engine.rootContext()->setContextProperty("Database", AsyncDatabase::shared());
    engine.rootContext()->setContextProperty("DatabaseConnector", new DatabaseConnector);
    engine.rootContext()->setContextProperty("GUIDGenerator", GUIDGenerator::shared());
    engine.rootContext()->setContextProperty("Settings", Settings::shared());
    //
    //
    //
    engine.addImageProvider("cached",new CachedImageProvider);
    engine.addImageProvider("noise",new MashNoise);
    engine.addImageProvider("qr",new Qr);
    //
    //
    //
    //NetworkConfiguration::shared()->update();
    //
    //
    //
    engine.load(QUrl(QLatin1String("qrc:/main.qml")));
    //
    //
    //
    QList<QObject*> rootObjects = engine.rootObjects();
    for ( auto object : rootObjects ) {
        if ( object->objectName() == "appWindow" ) {
            app.connect( &app, &QGuiApplication::commitDataRequest, [object](QSessionManager &manager) {
                Q_UNUSED(manager); // JONS: may use in future
                QMetaObject::invokeMethod(object, "save");
            } );
        }
    }
    //
    //
    //
    return app.exec();
}
