#include "compositeimage.h"
#include <QPainter>
#include <QDebug>
#include <QQuickItemGrabResult>
#include "systemutils.h"

CompositeImage::CompositeImage(QQuickItem *parent) : QQuickPaintedItem(parent) {

}

void CompositeImage::paint(QPainter *painter) {
    allocateImage();
    QRectF bounds(x(),y(),width(),height());
    painter->drawImage(bounds, m_image);
}

void CompositeImage::addImage( QQuickItem *image ) {
    allocateImage();
    QRectF bounds( image->x(), image->y(), image->width(), image->height());
    bounds = image->mapRectToItem(this,bounds);
    QSharedPointer<QQuickItemGrabResult> result = image->grabToImage();
    if ( result ) {
        connect(result.data(), &QQuickItemGrabResult::ready, [=]() {
            QPainter painter(&this->m_image);
            painter.setOpacity(.5);
            painter.setCompositionMode(QPainter::CompositionMode_DestinationOver);
            painter.drawImage(bounds,result->image());
            this->update();
        } );


    } else {
        qDebug() << "addImage : unable to paint item";
        QPainter painter(&m_image);
        painter.fillRect( bounds, Qt::red);
        update();
    }

}

void CompositeImage::allocateImage() {
    if ( m_image.isNull() || m_image.width() != width() || m_image.height() != height() ) {
        m_image = QImage(width(),height(),QImage::Format_ARGB32_Premultiplied);
        m_image.fill(Qt::transparent);
    }
}

