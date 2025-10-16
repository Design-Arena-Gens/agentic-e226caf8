import RobotArmCanvas from "@/components/RobotArmCanvas";

export default function Page() {
  return (
    <main>
      <h1>Robot Arm Inverse Kinematics</h1>
      <p>
        Drag anywhere on the canvas to position the target. The multi-jointed arm
        uses a FABRIK solver to reach for the target while staying within its
        joint limits. Each frame recomputes the configuration to illustrate how
        inverse kinematics works in real time.
      </p>
      <div className="canvas-shell">
        <RobotArmCanvas />
        <div className="controls">
          <span>Segments: 3</span>
          <span>Algorithm: FABRIK</span>
          <span>Drag to move target</span>
        </div>
      </div>
    </main>
  );
}
