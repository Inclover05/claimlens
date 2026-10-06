"use client";
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { DoubleSide, Group, MathUtils } from 'three';
import { useTheme } from 'next-themes';

function OpticalLens({active,dark}:{active:boolean;dark:boolean}){
  const lens=useRef<Group>(null);
  const orbit=useRef<Group>(null);
  useFrame(({clock,pointer},delta)=>{
    if(!active||!lens.current)return;
    const time=clock.elapsedTime, step=Math.min(delta,.05);
    lens.current.rotation.x=MathUtils.damp(lens.current.rotation.x,.28+Math.sin(time*.3)*.08+pointer.y*.1,3,step);
    lens.current.rotation.y=MathUtils.damp(lens.current.rotation.y,-.38+Math.sin(time*.22)*.18+pointer.x*.2,3,step);
    lens.current.position.y=Math.sin(time*.6)*.075;
    if(orbit.current)orbit.current.rotation.z+=step*.085;
  });
  return <group>
    <group ref={lens} rotation={[.28,-.38,-.22]}>
      <mesh><torusGeometry args={[1.13,.12,24,96]}/><meshPhysicalMaterial color={dark?'#c7eec2':'#3d795d'} roughness={.19} metalness={.55} clearcoat={1}/></mesh>
      <mesh><circleGeometry args={[1.02,64]}/><meshPhysicalMaterial color="#a2f4bb" transparent opacity={.16} roughness={.12} metalness={.2} side={DoubleSide} depthWrite={false}/></mesh>
      <mesh position={[0,0,.025]}><torusGeometry args={[.96,.008,8,96]}/><meshBasicMaterial color={dark?'#dafbd8':'#448b69'} transparent opacity={.5}/></mesh>
      <mesh position={[.72,.92,.13]}><sphereGeometry args={[.045,16,16]}/><meshBasicMaterial color="#ffffff"/></mesh>
    </group>
    <group ref={orbit} rotation={[.7,.3,-.4]}>
      <mesh><torusGeometry args={[1.65,.005,8,96]}/><meshBasicMaterial color={dark?'#bbdbb8':'#5a8d70'} transparent opacity={.32}/></mesh>
      <mesh position={[1.65,0,0]}><sphereGeometry args={[.035,12,12]}/><meshBasicMaterial color={dark?'#d4fdb6':'#286345'}/></mesh>
    </group>
  </group>;
}
export default function GlassScene({active,onReady}:{active:boolean;onReady:()=>void}){
  const {resolvedTheme}=useTheme();
  return <Canvas camera={{position:[0,0,4.9],fov:46}} dpr={[1,1.5]} frameloop={active?'always':'demand'} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onCreated={onReady}>
    <ambientLight intensity={1.6}/><directionalLight position={[-3,4,5]} intensity={4} color="#fff4d6"/><directionalLight position={[3,-1,2]} intensity={3} color="#9bf4b7"/>
    <OpticalLens active={active} dark={resolvedTheme!=='light'}/>
  </Canvas>;
}
