import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

# Wave parameters
length = 10             # domain length
points = 1000            # number of spatial points
x = np.linspace(0, length, points)
k = 2 * np.pi / length  # wave number
omega = 2 * np.pi       # angular frequency
speed = 4.0             # wave speed
t = 0                   # initial time
dt = 0.05               # time step

# Initialize figure
fig, ax = plt.subplots()
line, = ax.plot(x, np.sin(k * x))
ax.set_ylim(-1.5, 1.5)
ax.set_title("Traveling Sine Wave")

# Update function
def update(frame):
    global t
    t += dt
    y = np.sin(k * (x - speed * t))  # rightward traveling wave
    line.set_ydata(y)
    return [line]

ani = FuncAnimation(fig, update, frames=200, interval=30, blit=True)
plt.show()
