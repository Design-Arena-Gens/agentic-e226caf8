"use client";

import { useEffect, useRef } from "react";

type Vec2 = { x: number; y: number };

const SEGMENT_LENGTHS = [150, 120, 90];
const MAX_ITERATIONS = 16;
const TOLERANCE = 0.5;

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function fabrik(points: Vec2[], base: Vec2, target: Vec2, lengths: number[]) {
  if (points.length !== lengths.length + 1) {
    throw new Error("Points array should be one longer than lengths array");
  }

  const totalLength = lengths.reduce((sum, len) => sum + len, 0);
  const baseToTarget = distance(base, target);

  if (baseToTarget > totalLength) {
    const direction = normalize({ x: target.x - base.x, y: target.y - base.y });
    points[0] = { ...base };
    for (let i = 0; i < lengths.length; i += 1) {
      const prev = points[i];
      points[i + 1] = {
        x: prev.x + direction.x * lengths[i],
        y: prev.y + direction.y * lengths[i]
      };
    }
    return;
  }

  const constrainedBase = { ...base };
  let diff = distance(points[points.length - 1], target);
  let iteration = 0;

  while (diff > TOLERANCE && iteration < MAX_ITERATIONS) {
    iteration += 1;
    points[points.length - 1] = { ...target };

    for (let i = lengths.length - 1; i >= 0; i -= 1) {
      const current = points[i];
      const next = points[i + 1];
      const r = distance(next, current) || 1;
      const lambda = lengths[i] / r;
      points[i] = {
        x: (1 - lambda) * next.x + lambda * current.x,
        y: (1 - lambda) * next.y + lambda * current.y
      };
    }

    points[0] = { ...constrainedBase };

    for (let i = 0; i < lengths.length; i += 1) {
      const current = points[i];
      const next = points[i + 1];
      const r = distance(next, current) || 1;
      const lambda = lengths[i] / r;
      points[i + 1] = {
        x: (1 - lambda) * current.x + lambda * next.x,
        y: (1 - lambda) * current.y + lambda * next.y
      };
    }

    diff = distance(points[points.length - 1], target);
  }
}

export default function RobotArmCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const targetRef = useRef<Vec2>({ x: 0, y: 0 });
  const baseRef = useRef<Vec2>({ x: 0, y: 0 });
  const pointsRef = useRef<Vec2[]>([]);
  const draggingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const lengths = [...SEGMENT_LENGTHS];

    const ensurePoints = () => {
      if (pointsRef.current.length !== lengths.length + 1) {
        pointsRef.current = new Array(lengths.length + 1).fill(null).map(() => ({ x: 0, y: 0 }));
      }
    };

    const setSize = () => {
      const parent = canvas.parentElement;
      const preferredWidth = parent ? Math.min(parent.clientWidth, 900) : 720;
      const width = Math.max(preferredWidth, 360);
      const height = Math.round(width * 0.65);
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      baseRef.current = { x: width / 2, y: height * 0.75 };
      if (!draggingRef.current) {
        targetRef.current = {
          x: width / 2 + 40,
          y: height * 0.3
        };
      }

      ensurePoints();

      pointsRef.current[0] = { ...baseRef.current };
      let cursor = { ...baseRef.current };
      for (let i = 0; i < lengths.length; i += 1) {
        cursor = {
          x: cursor.x + lengths[i],
          y: cursor.y
        };
        pointsRef.current[i + 1] = { ...cursor };
      }
    };

    ensurePoints();
    setSize();

    const handleResize = () => {
      setSize();
    };

    window.addEventListener("resize", handleResize);

    const updateTarget = (event: PointerEvent) => {
      if (!canvas) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      targetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const handlePointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      canvas.setPointerCapture(event.pointerId);
      updateTarget(event);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }
      updateTarget(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      draggingRef.current = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (err) {
        // Ignore release failures.
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    const drawArm = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#10172b");
      gradient.addColorStop(1, "#090b18");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const gridSpacing = 40;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#5f73f3";
      ctx.lineWidth = 1;
      for (let x = (width % gridSpacing) / 2; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = (height % gridSpacing) / 2; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      const base = baseRef.current;
      const target = targetRef.current;
      const points = pointsRef.current;

      fabrik(points, base, target, lengths);

      ctx.strokeStyle = "rgba(102, 167, 255, 0.9)";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.fillStyle = "#f0f4ff";
      for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ff6b81";
      ctx.beginPath();
      ctx.arc(target.x, target.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 107, 129, 0.25)";
      ctx.beginPath();
      ctx.arc(target.x, target.y, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8b9bff";
      ctx.beginPath();
      ctx.arc(base.x, base.y, 14, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = () => {
      drawArm();
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-label="Robot arm inverse kinematics demo" />;
}
