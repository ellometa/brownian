import pygame
import numpy as np

# Simulation parameters
width, height = 300, 300          # simulation grid size
damping = 0.99                    # wave damping
c = 4.0                           # wave speed
dx = 2.0                          # spatial resolution
dt = 0.2                          # time step

# Display parameters
window_scale = 3                 # zoom factor
window_size = (width * window_scale, height * window_scale)

# Initialize fields
u = np.zeros((height, width), dtype=np.float32)
u_prev = np.zeros_like(u)
u_next = np.zeros_like(u)

# Initial pulse in the center
u[height // 2, width // 2] = 1.0

# Initialize pygame
pygame.init()
screen = pygame.display.set_mode(window_size)
pygame.display.set_caption("2D Wave Simulation")
clock = pygame.time.Clock()

# Simulation step function
def step(u, u_prev):
    laplacian = (
        -4 * u +
        np.roll(u, 1, axis=0) +
        np.roll(u, -1, axis=0) +
        np.roll(u, 1, axis=1) +
        np.roll(u, -1, axis=1)
    ) / dx**2

    u_next = 2 * u - u_prev + (c**2 * dt**2) * laplacian
    u_next *= damping
    return u_next

# Main loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Inject pulse with mouse
    if pygame.mouse.get_pressed()[0]:
        mx, my = pygame.mouse.get_pos()
        x, y = mx // window_scale, my // window_scale
        if 0 <= x < width and 0 <= y < height:
            u[y, x] = 1.0

    u_next = step(u, u_prev)
    u_prev, u = u, u_next

    vis = ((u - u.min()) / (np.ptp(u) + 1e-6) * 255).astype(np.uint8)
    surf = pygame.surfarray.make_surface(np.stack([vis] * 3, axis=-1))
    surf = pygame.transform.scale(surf, window_size)

    screen.blit(surf, (0, 0))
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
