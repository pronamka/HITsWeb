import {Config} from "./config.js";

export class Algorithms {

    static kMeansClustering(points, k) {
        if (points.length < k) {
            return Array(points.length)
                .fill()
                .map((_, i) => i);
        }

        let centroids = [{ ...points[Math.floor(Math.random() * points.length)] }];

        while (centroids.length < k) {
            let distances = points.map((point) => {
                return Math.min(
                    ...centroids.map(
                        (centroid) =>
                            Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2)
                    )
                );
            });

            let sum = distances.reduce((a, b) => a + b, 0);
            let random = Math.random() * sum;

            let acc = 0;
            for (let i = 0; i < points.length; i++) {
                acc += distances[i];
                if (acc >= random) {
                    centroids.push({ ...points[i] });
                    break;
                }
            }
        }

        let clusterAssignments = Array(points.length);
        let iterations = 0;

        while (iterations < Config.CLUSTERING.MAX_ITERATIONS) {
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                let minDistance = Infinity;
                let closestCluster = 0;

                for (let j = 0; j < centroids.length; j++) {
                    const distance = Math.sqrt(
                        Math.pow(point.y - centroids[j].y, 2) + Math.pow(point.x - centroids[j].x, 2)
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCluster = j;
                    }
                }
                clusterAssignments[i] = closestCluster;
            }

            let newCentroids = Array(k)
                .fill()
                .map(() => ({ y: 0, x: 0, count: 0 }));

            for (let i = 0; i < points.length; i++) {
                const clusterIndex = clusterAssignments[i];
                newCentroids[clusterIndex].y += points[i].y;
                newCentroids[clusterIndex].x += points[i].x;
                newCentroids[clusterIndex].count++;
            }

            let maxCentroidShift = 0;
            for (let i = 0; i < k; i++) {
                if (newCentroids[i].count > 0) {
                    const newY = newCentroids[i].y / newCentroids[i].count;
                    const newX = newCentroids[i].x / newCentroids[i].count;

                    const shift = Math.sqrt(
                        Math.pow(newY - centroids[i].y, 2) + Math.pow(newX - centroids[i].x, 2)
                    );
                    maxCentroidShift = Math.max(maxCentroidShift, shift);

                    centroids[i] = {
                        y: newY,
                        x: newX,
                    };
                }
            }

            iterations++;

            if (maxCentroidShift < Config.CLUSTERING.CONVERGENCE_THRESHOLD) {
                break;
            }
        }
        let totalDistance = 0;
        for (let i = 0; i < points.length; i++) {
            const centroid = centroids[clusterAssignments[i]];
            totalDistance += Math.sqrt(
                Math.pow(points[i].y - centroid.y, 2) + Math.pow(points[i].x - centroid.x, 2)
            );
        }

        return clusterAssignments;
    }

    static miniBatchKMeansClustering(points, k) {
        const batchSize = Math.min(Config.CLUSTERING.MIN_BATCH_SIZE, points.length);
        
        let centroids = [];
        let usedIndices = new Set();

        while (centroids.length < k) {
            const randomIndex = Math.floor(Math.random() * points.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                centroids.push({
                    x: points[randomIndex].x,
                    y: points[randomIndex].y,
                    count: 0,
                });
            }
        }

        let clusterAssignments = new Array(points.length).fill(0);

        for (let iteration = 0; iteration < Config.CLUSTERING.MAX_ITERATIONS; iteration++) {
            let batchIndices = new Set();
            while (batchIndices.size < batchSize) {
                batchIndices.add(Math.floor(Math.random() * points.length));
            }
            batchIndices = Array.from(batchIndices);

            batchIndices.forEach((pointIndex) => {
                const point = points[pointIndex];
                let minDistance = Infinity;
                let nearestCentroid = 0;

                centroids.forEach((centroid, centroidIndex) => {
                    const distance = this.calculateDistance(point, centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCentroid = centroidIndex;
                    }
                });

                clusterAssignments[pointIndex] = nearestCentroid;

                const centroid = centroids[nearestCentroid];
                centroid.count += 1;
                const learningRate = 1 / centroid.count;

                centroid.x = centroid.x * (1 - learningRate) + point.x * learningRate;
                centroid.y = centroid.y * (1 - learningRate) + point.y * learningRate;
            });
        }

        return clusterAssignments;
    }

    static hierarchicalClustering(points, k) {
        let clusters = points.map((point, index) => ({
            points: [point],
            index: index,
        }));

        let distances = [];
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                distances.push({
                    from: i,
                    to: j,
                    distance: this.calculateDistance(clusters[i].points[0], clusters[j].points[0]),
                });
            }
        }

        while (clusters.filter((c) => c !== null).length > k) {
            let minDistance = Infinity;
            let mergeIndexes = null;

            distances.forEach((d) => {
                if (d.distance < minDistance && clusters[d.from] !== null && clusters[d.to] !== null) {
                    minDistance = d.distance;
                    mergeIndexes = [d.from, d.to];
                }
            });

            if (!mergeIndexes) break;

            const [from, to] = mergeIndexes;
            clusters[from].points = clusters[from].points.concat(clusters[to].points);
            clusters[to] = null;

            distances = distances.map((d) => {
                if (d.from === to || d.to === to) {
                    return { ...d, distance: Infinity };
                }
                if (d.from === from || d.to === from) {
                    const otherIndex = d.from === from ? d.to : d.from;
                    if (clusters[otherIndex] === null) return d;

                    return {
                        ...d,
                        distance: this.calculateAverageDistance(
                            clusters[from].points,
                            clusters[otherIndex].points
                        ),
                    };
                }
                return d;
            });
        }

        let clusterAssignments = new Array(points.length);
        let clusterNumber = 0;

        clusters.forEach((cluster) => {
            if (cluster === null) return;

            cluster.points.forEach((point) => {
                const pointIndex = points.findIndex((p) => p.x === point.x && p.y === point.y);
                clusterAssignments[pointIndex] = clusterNumber;
            });
            clusterNumber++;
        });

        return clusterAssignments;
    }


    static calculateDistance(point1, point2) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }

    static calculateAverageDistance(points1, points2) {
        let totalDistance = 0;
        let count = 0;

        points1.forEach((p1) => {
            points2.forEach((p2) => {
                totalDistance += this.calculateDistance(p1, p2);
                count++;
            });
        });

        return totalDistance / count;
    }
}