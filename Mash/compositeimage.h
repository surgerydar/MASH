#ifndef COMPOSITEIMAGE_H
#define COMPOSITEIMAGE_H

#include <QQuickPaintedItem>
#include <QImage>
#include <QVariant>
#include <QMutex>
#include <QThread>

class FadeThread : public QThread {
    Q_OBJECT
public:
    explicit FadeThread(QObject*parent) : QThread(parent) {

    }
    void run() override;
};

class CompositeImage : public QQuickPaintedItem
{
    Q_OBJECT
public:
    explicit CompositeImage(QQuickItem *parent = 0);
    //
    //
    //
    void paint(QPainter *painter) override;
    //
    //
    //
    QImage* getImage() { return &m_image; }
signals:

public slots:
    void addImage( QQuickItem *image );
    void save();
    void load();
    void lock() { m_guard.lock(); }
    void unlock() { m_guard.unlock(); }
    void start();
    void stop();
private:
    void allocateImage();
    void clearGrabResult( QString id );
    QMutex m_guard;
    QImage m_image;
    FadeThread* m_fader;
    QMap< QString,QSharedPointer<QQuickItemGrabResult> > m_grabResults;
};


#endif // COMPOSITEIMAGE_H
