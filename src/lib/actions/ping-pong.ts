export function pingPong(node: HTMLVideoElement) {

    function onTimeUpdate() {
        if (!node.duration) return;
        if (node.playbackRate > 0 && node.currentTime >= node.duration * 0.5) {
            node.playbackRate = -1;
        } else if (node.playbackRate < 0 && node.currentTime <= 0) {
            node.playbackRate = 1;
        }
    }

    function onLoadedMetadata() {
        if (node.duration && node.duration > 0) {
            node.currentTime = 0;
            node.playbackRate = 1;
            // Do not auto-play here; playback will be controlled by the IntersectionObserver.
        }
    }

    // Use IntersectionObserver to play/pause when the video is in view.
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    node.play().catch(() => { /* prevent unhandled promise rejection */ });
                } else {
                    node.pause();
                }
            }
        },
        { threshold: 0.5 } // Adjust the threshold as needed.
    );
    observer.observe(node);

    return {
        destroy() {
            node.removeEventListener("loadedmetadata", onLoadedMetadata);
            node.removeEventListener("timeupdate", onTimeUpdate);
            observer.disconnect();
        }
    };
}