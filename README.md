# Bend a sine

Planned: https://bend-a-sine.ichabod-crane.net/ — not deployed yet.
A finite-note instrument for hearing one sine bend another. Data is disposable; nothing a visitor relies on is stored.

Planner preparation contains independent behavior contracts only, not a runtime or a demonstrated reference implementation. Runtime work is on the board.

Inspiration: https://github.com/AL-255/FM-1-RE (firmware analysis, not an emulation target). Mathematical background: https://www.cs.cmu.edu/~music/icm-online/readings/fm-synthesis/index.html . We specify the phase-modulated sine directly rather than copying the reading's inconsistent reuse of D in its displayed formula.
