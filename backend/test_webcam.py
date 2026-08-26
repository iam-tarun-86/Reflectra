"""Quick webcam test — run this to confirm OpenCV can access the camera."""
import cv2
import sys


def test_webcam():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Could not open webcam (index 0)")
        sys.exit(1)

    print(f"Webcam opened: {cap.get(cv2.CAP_PROP_FRAME_WIDTH):.0f}x{cap.get(cv2.CAP_PROP_FRAME_HEIGHT):.0f}")
    print("Press 'q' in the OpenCV window to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("ERROR: Failed to read frame")
            break
        cv2.imshow("Reflectra — Webcam Test", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Webcam test passed.")


if __name__ == "__main__":
    test_webcam()
