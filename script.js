import React, { useState, useEffect, useRef } from 'https://cdn.skypack.dev/react';
import gsap from 'https://cdn.skypack.dev/gsap';
import { render } from 'https://cdn.skypack.dev/react-dom';
import { GUI } from 'https://cdn.skypack.dev/dat.gui';

const ROOT_NODE = document.querySelector('#app');

const useParallax = (callback, elementRef, proximityArg = 100) => {
  React.useEffect(() => {
    if (!elementRef.current || !callback) return;
    const UPDATE = ({ x, y }) => {
      const bounds = 100;
      const proximity = typeof proximityArg === 'function' ? proximityArg() : proximityArg;
      const elementBounds = elementRef.current.getBoundingClientRect();
      const centerX = elementBounds.left + elementBounds.width / 2;
      const centerY = elementBounds.top + elementBounds.height / 2;
      const boundX = gsap.utils.mapRange(centerX - proximity, centerX + proximity, -bounds, bounds, x);
      const boundY = gsap.utils.mapRange(centerY - proximity, centerY + proximity, -bounds, bounds, y);
      callback(boundX / 100, boundY / 100);
    };
    window.addEventListener('pointermove', UPDATE);
    return () => {
      window.removeEventListener('pointermove', UPDATE);
    };
  }, [elementRef, callback]);
};


const FlippySnap = ({ disabled, gridSize, onFlip, snaps, snapRef }) => {
  const CELL_COUNT = Math.pow(gridSize, 2);
  const count = useRef(0);
  const containerRef = snapRef || useRef(null);
  const flipping = useRef(false);
  const audioRef = useRef(
  new Audio('https://assets.codepen.io/605876/page-flip.mp3'));

  audioRef.current.volume = 0.5;

  const flip = e => {
    if (disabled || flipping.current) return;
    const x = parseInt(e.target.parentNode.getAttribute('data-snap-x'), 10);
    const y = parseInt(e.target.parentNode.getAttribute('data-snap-y'), 10);
    count.current = count.current + 1;
    gsap.to(containerRef.current.querySelectorAll('.flippy-card'), {
      '--count': count.current,
      delay: gsap.utils.distribute({
        from: [x / gridSize, y / gridSize],
        amount: gridSize / 20,
        base: 0,
        grid: [gridSize, gridSize],
        ease: 'power1.inOut' }),

      duration: 0.2,
      onStart: () => {
        flipping.current = true;
        audioRef.current.play();
      },
      onComplete: () => {
        // At this point update the images
        flipping.current = false;
        if (onFlip) onFlip(count);
      } });

  };

  const indicate = e => {
    const x = parseInt(e.currentTarget.getAttribute('data-snap-x'), 10);
    const y = parseInt(e.currentTarget.getAttribute('data-snap-y'), 10);
    gsap.to(containerRef.current.querySelectorAll('.flippy-card'), {
      '--hovered': gsap.utils.distribute({
        from: [x / gridSize, y / gridSize],
        base: 0,
        amount: 1,
        grid: [gridSize, gridSize],
        ease: 'power1.inOut' }),

      duration: 0.1 });

  };

  const reset = () => {
    gsap.to(containerRef.current.querySelectorAll('.flippy-card'), {
      '--hovered': 1,
      duration: 0.1 });

  };

  return /*#__PURE__*/(
    React.createElement("button", {
      className: "flippy-snap",
      ref: containerRef,
      onPointerLeave: reset,
      style: {
        '--grid-size': gridSize,
        '--count': count.current,
        '--current-image': `url('${snaps[0]}')`,
        '--next-image': `url('${snaps[1]}')` },

      onClick: flip },
    new Array(CELL_COUNT).fill().map((cell, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);
      return /*#__PURE__*/(
        React.createElement("span", {
          onPointerOver: indicate,
          className: "flippy-card",
          "data-snap-x": x,
          "data-snap-y": y,
          style: {
            '--x': x,
            '--y': y } }, /*#__PURE__*/

        React.createElement("span", { className: "flippy-card__front" }), /*#__PURE__*/
        React.createElement("span", { className: "flippy-card__rear" })));


    }),
    disabled && /*#__PURE__*/React.createElement("span", { className: "flippy-snap__loader" })));


};


const App = () => {
  const [snaps, setSnaps] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [gridSize, setGridSize] = useState(9);
  const snapRef = useRef(null);

  useParallax((x, y) => {
    snapRef.current.style.setProperty('--range-x', Math.floor(gsap.utils.clamp(-60, 60, x * 100)));
    snapRef.current.style.setProperty('--range-y', Math.floor(gsap.utils.clamp(-60, 60, y * 100)));
  }, snapRef, () => window.innerWidth * 0.5);

  const grabPic = async () => {
    const pic = await fetch('https://source.unsplash.com/random/1000x1000');
    return pic.url;
  };

  useEffect(() => {
    const setup = async () => {
      const url = await grabPic();
      // Dirty hack to make sure we get two images
      await new Promise(resolve => setTimeout(resolve, 1000));
      const nextUrl = await grabPic();
      setSnaps([url, nextUrl]);
      setDisabled(false);
    };
    setup();
  }, []);

  useEffect(() => {
    // Set up DAT.GUI
    const CONFIG = {
      gridSize };

    const CONTROLLER = new GUI();
    CONTROLLER.add(CONFIG, 'gridSize', 2, 15, 1).
    onFinishChange(setGridSize).
    name('Grid Size');
  }, []);

  const setNewImage = async count => {
    const newSnap = await grabPic();
    setSnaps(
    count.current % 2 !== 0 ? [newSnap, snaps[1]] : [snaps[0], newSnap]);

    setDisabled(false);
  };

  const onFlip = async count => {
    setDisabled(true);
    setNewImage(count);
  };

  if (snaps.length !== 2) return /*#__PURE__*/React.createElement("h1", { className: "loader" }, "Loading...");
  return /*#__PURE__*/(
    React.createElement(FlippySnap, {
      gridSize: gridSize,
      disabled: disabled,
      snaps: snaps,
      onFlip: onFlip,
      snapRef: snapRef }));


};

render( /*#__PURE__*/React.createElement(App, null), ROOT_NODE);