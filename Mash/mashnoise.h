#ifndef NOISE_H
#define NOISE_H

#include <QQuickImageProvider>

class MashNoise : public QQuickImageProvider
{
public:
    MashNoise();
    QImage requestImage(const QString &id, QSize *size, const QSize &requestedSize) override;
signals:

public slots:
};

#endif // NOISE_H
