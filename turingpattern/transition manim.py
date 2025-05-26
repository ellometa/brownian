from manim import *

class CubeToSphere(ThreeDScene):
    def construct(self):
        vcube = Cube(side_length=2, fill_opacity=0.5, color=RED, fill_color=RED)
        vsphere = Sphere(radius=1.5, fill_opacity=0.5, color=GOLD_A, fill_color=GOLD_A)
        vdonut = Torus(major_radius = 1.5, minor_radius=0.5, color=RED, fill_color=RED, fill_opacity = 0.5)

        self.set_camera_orientation(phi=75 * DEGREES, theta=30 * DEGREES)

        self.play(Create(vcube), run_time=0.5)
        self.play(Rotate(vcube, angle=PI/4, axis=OUT), run_time=1)
        self.play(ReplacementTransform(vcube, vsphere), run_time=0.5)
        self.play(Rotate(vsphere, angle=2 * PI, axis=UP), run_time=1)
        self.play(ReplacementTransform(vsphere, vdonut), run_time=0.5)
        self.play(Uncreate(vdonut))
        self.wait(1)

