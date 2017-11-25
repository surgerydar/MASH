#include "compositeimage.h"
#include <QPainter>
#include <QDebug>
#include <QQuickItemGrabResult>
#include <QFile>
#include <QThread>
#include "systemutils.h"

void FadeThread::run() {
    CompositeImage* target = ( CompositeImage* ) parent();
    while( !isInterruptionRequested() ) {
        QImage* image = target->getImage();
        if ( image && !image->isNull() && image->width() > 0 && image->height() > 0 ) {
            int bytesPerPixel = image->bytesPerLine() / image->width();
            for (int y = 0; y < image->height(); ++y) {
                target->lock();
                QRgb *rgba;
                uchar* pixel = image->scanLine(y);
                for (int x = 0; x < image->width(); ++x) {
                    rgba = (QRgb *)pixel;

                    if (qAlpha(*rgba) != 0 && (qRed(*rgba) != 0 || qGreen(*rgba) != 0 || qBlue(*rgba) != 0)) {
                        QColor c = QColor::fromRgba(*rgba);
                        qreal h,s,v,a;
                        c.getHsvF(&h,&s,&v,&a);
                        qreal before;
                        if ( x == 100 && y == 100 ) {
                            before = v;
                        }
                        v *= .99;
                        c.setHsvF(h,s,v,a);
                        *rgba = c.rgba();
                        if ( x == 100 && y == 100 ) {
                            qDebug() << "before:" << before << " after:" << c.valueF();
                        }
                        //*rgba = QColor::fromRgba(*rgba).darker(101).rgba();
                    }

                    pixel += bytesPerPixel;
                }
                target->unlock();
                //target->update();
                if ( isInterruptionRequested() ) {
                    break;
                }
            }
            QThread::msleep(1000*2);
        }
    }
}

CompositeImage::CompositeImage(QQuickItem *parent) : QQuickPaintedItem(parent) {
    m_fader = nullptr;
}

void CompositeImage::paint(QPainter *painter) {
    allocateImage();
    QRectF bounds(x(),y(),width(),height());
    m_guard.lock();
    painter->drawImage(bounds, m_image);
    m_guard.unlock();
    update();
}

void CompositeImage::addImage( QQuickItem *image ) {
    allocateImage();
    QRectF bounds( image->x(), image->y(), image->width(), image->height());
    bounds = image->mapRectToItem(this,bounds);
    QSharedPointer<QQuickItemGrabResult> result = image->grabToImage();
    if ( result ) {
        connect(result.data(), &QQuickItemGrabResult::ready, [=]() {
            QMutexLocker locker(&this->m_guard);
            QPainter painter(&this->m_image);
            //painter.setCompositionMode(QPainter::CompositionMode_DestinationOver);
            //painter.setOpacity(.15);
            painter.setCompositionMode(QPainter::CompositionMode_SourceOver);
            painter.setOpacity(image->opacity());
            painter.drawImage(bounds,result->image());
            this->update();
        } );
    } else {
        qDebug() << "addImage : unable to paint item";
        QMutexLocker locker(&m_guard);
        QPainter painter(&m_image);
        painter.fillRect( bounds, Qt::red);
        update();
    }
}

void CompositeImage::save() {
    QMutexLocker locker(&m_guard);
    QString path = SystemUtils::shared()->documentDirectory().append("/").append("mash-composite.png");
    m_image.save(path);
}

void CompositeImage::load() {
    QMutexLocker locker(&m_guard);
    QString path = SystemUtils::shared()->documentDirectory().append("/").append("mash-composite.png");
    if ( QFile::exists(path) ) {
        m_image.load(path);
    }
}

void CompositeImage::start() {
    m_fader = new FadeThread((QObject*)this);
    connect(m_fader, &FadeThread::finished, m_fader, &QObject::deleteLater);
    m_fader->start();
}

void CompositeImage::stop() {
    m_fader->requestInterruption();
    m_fader->wait();
}

void CompositeImage::allocateImage() {
    if ( m_image.width() != width() || m_image.height() != height() ) {
        QMutexLocker locker(&m_guard);
        QImage current = m_image;
        m_image = QImage(width(),height(),QImage::Format_ARGB32_Premultiplied);
        if ( current.isNull() ) {
            m_image.fill(Qt::black);
        } else {
            QRect bounds(0,0,width(),height());
            QPainter painter(&m_image);
            painter.drawImage(bounds,current);
        }

    }
}
/*
void CompositeImage::fade() {
    QRectF bounds( 0, 0, m_image.width(), m_image.height());
    QPainter painter( &m_image );
    QColor fill( 253, 253, 253 );//, 2 );
    painter.setCompositionMode(QPainter::CompositionMode_Multiply);
    //painter.setOpacity(.01);
    painter.fillRect( bounds, fill);
    update();
}
*/

