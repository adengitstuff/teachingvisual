import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current!

   /** pivoting from TOP + html + BOTTOM boilerplate ideas to useEffects to test iterability :o */
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000)
    mount.appendChild(renderer.domElement)

    camera.position.z = 5

    /** raw visualization loop */
    let animFrameId: number
    let currentUpdateScene = (_t: number) => {}
    const startTime = performance.now()

    function loop() {
      animFrameId = requestAnimationFrame(loop)
      const t = (performance.now() - startTime) / 1000
      currentUpdateScene(t)
      renderer.render(scene, camera)
    }
    loop()

    /** okay, let's try runScene as calling the setup
     * andideally setting up for iterative builds later.
     */
    ;(window as any).runScene = (code: string) => {
    while (scene.children.length > 0) scene.remove(scene.children[0])
    currentUpdateScene = (_t: number) => {}

    const fn = new Function('THREE', 'scene', 'camera', 'renderer', `
        ${code}
        setupScene()
        return updateScene
    `)
    currentUpdateScene = fn(THREE, scene, camera, renderer)
    }

    /** Resize function */
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}