import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

length = 10
points = 1000
x = np.linspace(0, length, points)
k = 2 * np.pi / length
omega = 2 * np.pi
speed = 4.0
t = 0
dt = 0.05

fig, ax = plt.subplots()
line, = ax.plot(x, np.sin(k * x))
ax.set_ylim(-1.5, 1.5)
ax.set_title("Traveling Sine Wave")

def update(frame):
    global t
    t += dt
    y = np.sin(k * (x - speed * t))
    line.set_ydata(y)
    return [line]

ani = FuncAnimation(fig, update, frames=200, interval=30, blit=True)
plt.show()
