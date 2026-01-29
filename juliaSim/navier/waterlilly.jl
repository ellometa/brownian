using WaterLily

include("Recordvol.jl")

function TGV(p = 5, Re = 100_000)
    # define vortex size, velocity, viscosity
    L = 2^p
    U = 1.0f0
    ν = U * L / Re # \nu not v
    # Taylor-Green Vortex initial velocity field
    uλ = let L=Float32(L), U=1.0f0
        (i, vx) -> begin
            # scaled coordinates
            x = (vx[1] - 1.5f0) * Float32(pi) / L
            y = (vx[2] - 1.5f0) * Float32(pi) / L
            z = (vx[3] - 1.5f0) * Float32(pi) / L
            if i == 1
                return -U * sin(x) * cos(y) * cos(z)
            elseif i == 2
                return  U * cos(x) * sin(y) * cos(z)
            else
                return 0.0f0
            end
        end
    end
    # initialize simulation
    return Simulation(
        (L, L, L), (0.0f0, 0.0f0, 0.0f0), L;
        U, uλ, ν, T = Float32
    )
end

function omega_mag_data(sim)
    @inside sim.flow.σ[I] = 
        WaterLily.ω_mag(I, sim.flow.u) * sim.L / sim.U
    return Array(@view sim.flow.σ[2:end-1, 2:end-1, 2:end-1])
end


sim, fig = record_volume(TGV(), omega_mag_data;
    name = "TGV.mp4",
    duration = 20,
    step = 0.025
)