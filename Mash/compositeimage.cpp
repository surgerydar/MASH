#include "compositeimage.h"
#include <QPainter>
#include <QDebug>
#include <QQuickItemGrabResult>
#include <QFile>
#include <QThread>
#include <QUuid>
#include "systemutils.h"

void FadeThread::run() {
    CompositeImage* target = ( CompositeImage* ) parent();
    while( !isInterruptionRequested() ) {
        QImage* image = target->getImage();
        if ( image && !image->isNull() && image->width() > 0 && image->height() > 0 ) {
            int height = image->height();
            int bytesPerPixel = image->bytesPerLine() / image->width();
            for (int y = 0; y < height; ++y) {
                target->lock();
                QRgb *rgba;
                uchar* pixel = image->scanLine(y);
                int width = image->width();
                for (int x = 0; x < width; ++x) {
                    rgba = (QRgb *)pixel;

                    if (qAlpha(*rgba) != 0 && (qRed(*rgba) != 0 || qGreen(*rgba) != 0 || qBlue(*rgba) != 0)) {
                        QColor c = QColor::fromRgba(*rgba);
                        qreal h,s,v,a;
                        c.getHsvF(&h,&s,&v,&a);
                        v *= .99;
                        c.setHsvF(h,s,v,a);
                        *rgba = c.rgba();
                    }
                    pixel += bytesPerPixel;
                }
                target->unlock();
                //target->update();
                if ( isInterruptionRequested() || image->width() != width || image->height() != height ) {
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
    QRectF bounds(x(),y(),width(),height());
    if ( bounds.width() > 0 && bounds.height() > 0 ) {
        allocateImage();
        m_guard.lock();
        painter->drawImage(bounds, m_image);
        m_guard.unlock();
        update();
    }
}

void CompositeImage::addImage( QQuickItem *image ) {
    allocateImage();
    QRectF bounds( image->x(), image->y(), image->width(), image->height());
    bounds = image->mapRectToItem(this,bounds);
    qreal opacity = image->opacity();
    QSharedPointer<QQuickItemGrabResult> result = image->grabToImage();
    if ( result ) {
        QString id = QUuid::createUuid().toString();
        m_grabResults[id] = result;
        connect(result.data(), &QObject::destroyed,[id]() {
            qDebug() << "CompositeImage::addImage : grab result destroyed : " << id;
        });
        connect(result.data(), &QQuickItemGrabResult::ready, [this,bounds,opacity,id]() {
            if ( this->m_grabResults.contains(id) ) {
                QSharedPointer<QQuickItemGrabResult> result = m_grabResults[ id ];
                QMutexLocker locker(&this->m_guard);
                QImage image = result->image();
                QPainter painter(&this->m_image);
                painter.setCompositionMode(QPainter::CompositionMode_SourceOver);
                painter.setOpacity(opacity);
                painter.drawImage(bounds,image);
                this->update();
                this->clearGrabResult(id);
            }
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
    qDebug() << "CompositeImage::save";
    QString path = SystemUtils::shared()->documentDirectory().append("/").append("mash-composite.png");
    m_image.save(path);
    qDebug() << "CompositeImage::save : done";
}

void CompositeImage::load() {
    QMutexLocker locker(&m_guard);
    qDebug() << "CompositeImage::load";

    QString path = SystemUtils::shared()->documentDirectory().append("/").append("mash-composite.png");
    if ( QFile::exists(path) ) {
        m_image.load(path);
        qDebug() << "CompositeImage::load : done";
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
        qDebug() << "CompositeImage::allocateImage : " << width() << "x" << height();
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
        qDebug() << "CompositeImage::allocateImage : done";

    }
}

void CompositeImage::clearGrabResult( QString id ) {
    if ( m_grabResults.contains(id) ) {
        m_grabResults[ id ].clear();
        m_grabResults.remove(id);
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

