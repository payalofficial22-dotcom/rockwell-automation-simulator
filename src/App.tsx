import { useMemo, useState } from 'react';

const nodePositions = {
  hmi: { x: 205, y: 280 },
  switch: { x: 600, y: 280 },
  plc: { x: 1025, y: 280 },
  drive: { x: 245, y: 510 },
  motor: { x: 600, y: 510 },
  sensor: { x: 955, y: 510 },
};

type Device = 'hmi' | 'switch' | 'plc' | 'drive' | 'motor' | 'sensor';

type LogKind = 'info' | 'success' | 'warn' | 'error';

type DeviceInfo = {
  name: string;
  ip: string;
  vlan: string;
  mac: string;
  role: string;
  summary: string;
};

const deviceInfo: Record<Device, DeviceInfo> = {
  hmi: {
    name: 'HMI',
    ip: '192.168.10.11',
    vlan: '10',
    mac: 'AA:AA:AA:AA:AA:11',
    role: 'Operator interface',
    summary: 'Allows the operator to monitor and start or stop the machine.',
  },
  switch: {
    name: 'Stratix Switch',
    ip: '192.168.10.1',
    vlan: '10',
    mac: 'AA:AA:AA:AA:AA:01',
    role: 'Industrial managed switch',
    summary: 'Switches Ethernet frames based on MAC addresses and manages VLAN traffic.',
  },
  plc: {
    name: 'PLC',
    ip: '192.168.10.20',
    vlan: '10',
    mac: 'AA:AA:AA:AA:AA:20',
    role: 'Logic controller',
    summary: 'Receives commands and executes control logic for the process.',
  },
  drive: {
    name: 'Drive',
    ip: '192.168.10.30',
    vlan: '10',
    mac: 'AA:AA:AA:AA:AA:30',
    role: 'Motor control',
    summary: 'Controls motor speed and direction according to PLC logic.',
  },
  motor: {
    name: 'Motor',
    ip: '192.168.10.40',
    vlan: '10',
    mac: 'AA:AA:AA:AA:AA:40',
    role: 'Actuator',
    summary: 'Converts electrical command into rotary motion.',
  },
  sensor: {
    name: 'Sensor',
    ip: '192.168.10.50',
    vlan: '10',
    mac: 'AA:AA:AA:AA:AA:50',
    role: 'Feedback input',
    summary: 'Measures motor speed and temperature and reports status back to the PLC.',
  },
};

const flowSteps = [
  'Operator presses START',
  'HMI sends command',
  'Stratix switches frame',
  'EtherNet/IP carries CIP',
  'PLC receives command',
  'PLC executes logic',
  'Drive receives command',
  'Motor starts',
  'Sensors provide feedback',
  'PLC receives feedback',
  'HMI/SCADA shows RUNNING',
];

const packetSequence = [
  { from: 'hmi', to: 'switch', color: '#3ce67d', label: 'EtherNet/IP control packet' },
  { from: 'switch', to: 'plc', color: '#3ce67d', label: 'Frame forwarded to PLC' },
  { from: 'plc', to: 'drive', color: '#3ce67d', label: 'PLC commands drive' },
  { from: 'drive', to: 'motor', color: '#3ce67d', label: 'Drive starts motor' },
  { from: 'motor', to: 'sensor', color: '#47b3ff', label: 'Motor feedback' },
  { from: 'sensor', to: 'plc', color: '#47b3ff', label: 'Feedback to PLC' },
  { from: 'plc', to: 'hmi', color: '#47b3ff', label: 'Status update to HMI' },
];

function App() {
  const [motorStatus, setMotorStatus] = useState<'STOPPED' | 'RUNNING'>('STOPPED');
  const [driveStatus, setDriveStatus] = useState<'IDLE' | 'RUN' | 'FAULT'>('IDLE');
  const [networkStatus, setNetworkStatus] = useState<'HEALTHY' | 'FAULT'>('HEALTHY');
  const [speed, setSpeed] = useState(0);
  const [temp, setTemp] = useState(25);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<Device>('plc');
  const [packet, setPacket] = useState({ visible: false, from: 'hmi', to: 'switch', x: 205, y: 280, color: '#3ce67d' });
  const [logs, setLogs] = useState<string[]>(['System ready. Press START MOTOR to begin.']);
  const [tab, setTab] = useState<'network' | 'arp' | 'packet'>('network');

  const selectedDevice = useMemo(() => deviceInfo[selected], [selected]);

  const addLog = (message: string, kind: LogKind = 'info') => {
    const prefix = kind === 'success' ? '✅ ' : kind === 'warn' ? '⚠ ' : kind === 'error' ? '❌ ' : 'ℹ ';
    const next = [prefix + message, ...logs].slice(0, 10);
    setLogs(next);
  };

  const animatePacket = (from: Device, to: Device, color: string) => {
    const start = nodePositions[from];
    const end = nodePositions[to];

    setPacket({
      visible: true,
      from,
      to,
      x: start.x,
      y: start.y,
      color,
    });

    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const x = start.x + (end.x - start.x) * progress;
      const y = start.y + (end.y - start.y) * progress;
      setPacket((prev) => ({ ...prev, x, y }));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setPacket((prev) => ({ ...prev, visible: false }));
      }
    };

    requestAnimationFrame(tick);
  };

  const handleStart = async () => {
    setMotorStatus('RUNNING');
    setDriveStatus('RUN');
    setNetworkStatus('HEALTHY');
    setSpeed(0);
    setTemp(25);
    setActiveIndex(-1);
    setLogs([]);
    addLog('Operator pressed START on HMI.', 'success');

    const sequence = [
      { step: 0, label: 'HMI sends START command.', from: 'hmi', to: 'switch', color: '#3ce67d' },
      { step: 1, label: 'Stratix switches Ethernet frame to PLC.', from: 'switch', to: 'plc', color: '#3ce67d' },
      { step: 2, label: 'PLC received START command.', from: 'plc', to: 'plc', color: '#3ce67d' },
      { step: 3, label: 'PLC executes logic and enables drive.', from: 'plc', to: 'drive', color: '#3ce67d' },
      { step: 4, label: 'Drive starts motor.', from: 'drive', to: 'motor', color: '#3ce67d' },
      { step: 5, label: 'Motor feedback generated.', from: 'motor', to: 'sensor', color: '#47b3ff' },
      { step: 6, label: 'Sensor feedback received by PLC.', from: 'sensor', to: 'plc', color: '#47b3ff' },
      { step: 7, label: 'PLC updates HMI/SCADA as RUNNING.', from: 'plc', to: 'hmi', color: '#47b3ff' },
    ];

    for (let i = 0; i < sequence.length; i += 1) {
      const current = sequence[i];
      setActiveIndex(i);
      addLog(current.label, 'success');
      if (current.from !== current.to) {
        animatePacket(current.from as Device, current.to as Device, current.color);
      }
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    for (let value = 0; value <= 1000; value += 100) {
      setSpeed(value);
      setTemp(25 + value / 100);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    setMotorStatus('RUNNING');
    setDriveStatus('RUN');
    setNetworkStatus('HEALTHY');
    setActiveIndex(flowSteps.length - 1);
    addLog('Real-time status updated. Motor is RUNNING at 1000 RPM.', 'success');
  };

  const handleStop = () => {
    setMotorStatus('STOPPED');
    setDriveStatus('IDLE');
    setSpeed(0);
    setTemp(25);
    setActiveIndex(0);
    addLog('STOP command sent to drive and motor is slowing down.', 'warn');
  };

  const handleFault = () => {
    setMotorStatus('STOPPED');
    setDriveStatus('FAULT');
    setNetworkStatus('FAULT');
    setSpeed(0);
    setTemp(60);
    setActiveIndex(4);
    addLog('Drive fault: Overtemperature. HMI shows CRITICAL ALARM.', 'error');
    animatePacket('drive', 'plc', '#ff5b5b');
  };

  const handleReset = () => {
    setMotorStatus('STOPPED');
    setDriveStatus('IDLE');
    setNetworkStatus('HEALTHY');
    setSpeed(0);
    setTemp(25);
    setActiveIndex(-1);
    setLogs(['System reset. Ready for START MOTOR.']);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Rockwell Automation</div>
          <h1>Industrial Control + Networking Simulator</h1>
        </div>

        <div className="button-row">
          <button className="primary" onClick={handleStart}>START MOTOR</button>
          <button className="secondary" onClick={handleStop}>STOP MOTOR</button>
          <button className="danger" onClick={handleFault}>FAULT</button>
          <button className="ghost" onClick={handleReset}>RESET</button>
        </div>
      </header>

      <main className="content-grid">
        <section className="diagram-panel panel">
          <svg viewBox="0 0 1200 700" className="diagram" role="img" aria-label="Factory network diagram">
            <defs>
              <marker id="arrowGreen" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="#3ce67d" />
              </marker>
              <marker id="arrowBlue" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="#47b3ff" />
              </marker>
              <marker id="arrowRed" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="#ff5b5b" />
              </marker>
              <marker id="arrowPurple" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="#b57cff" />
              </marker>
            </defs>

            <g>
              <rect x="430" y="30" width="340" height="70" rx="12" fill="rgba(181,124,255,0.13)" stroke="#b57cff" strokeWidth="2" />
              <text x="600" y="72" textAnchor="middle" fill="#d8bbff" fontSize="22" fontWeight="700">FACTORYTALK / SCADA</text>
            </g>

            <g>
              <rect x="60" y="120" width="1080" height="34" rx="14" fill="rgba(71,179,255,0.08)" stroke="#47b3ff" strokeWidth="1.5" />
              <text x="600" y="142" textAnchor="middle" fill="#8ed3ff" fontSize="14" fontWeight="700">VLAN 10 - CONTROL NETWORK</text>
            </g>

            <g onClick={() => setSelected('hmi')} className="device-group clickable">
              <rect x="90" y="220" width="180" height="120" rx="14" className={selected === 'hmi' ? 'device-box selected' : 'device-box'} />
              <circle cx="150" cy="245" r="7" fill={motorStatus === 'STOPPED' ? '#3ce67d' : '#3ce67d'} />
              <text x="180" y="272" textAnchor="middle" fill="#f4faff" fontSize="18" fontWeight="700">HMI</text>
              <text x="180" y="296" textAnchor="middle" fill="#b8d7e8" fontSize="11">192.168.10.11</text>
              <text x="180" y="314" textAnchor="middle" fill="#b8d7e8" fontSize="11">VLAN 10</text>
            </g>

            <g onClick={() => setSelected('switch')} className="device-group clickable">
              <rect x="510" y="220" width="180" height="120" rx="14" className={selected === 'switch' ? 'device-box selected' : 'device-box'} />
              <circle cx="570" cy="245" r="7" fill="#3ce67d" />
              <text x="600" y="272" textAnchor="middle" fill="#f4faff" fontSize="18" fontWeight="700">STRATIX</text>
              <text x="600" y="296" textAnchor="middle" fill="#b8d7e8" fontSize="11">Layer 2 switch</text>
              <text x="600" y="314" textAnchor="middle" fill="#b8d7e8" fontSize="11">MAC AA:AA:AA:AA:AA:01</text>
            </g>

            <g onClick={() => setSelected('plc')} className="device-group clickable">
              <rect x="930" y="220" width="180" height="120" rx="14" className={selected === 'plc' ? 'device-box selected' : 'device-box'} />
              <circle cx="990" cy="245" r="7" fill="#3ce67d" />
              <text x="1020" y="272" textAnchor="middle" fill="#f4faff" fontSize="18" fontWeight="700">PLC</text>
              <text x="1020" y="296" textAnchor="middle" fill="#b8d7e8" fontSize="11">192.168.10.20</text>
              <text x="1020" y="314" textAnchor="middle" fill="#b8d7e8" fontSize="11">GW 192.168.10.1</text>
            </g>

            <g onClick={() => setSelected('drive')} className="device-group clickable">
              <rect x="150" y="440" width="180" height="120" rx="14" className={selected === 'drive' ? 'device-box selected' : 'device-box'} />
              <circle cx="210" cy="465" r="7" fill={driveStatus === 'FAULT' ? '#ff5b5b' : '#3ce67d'} />
              <text x="240" y="490" textAnchor="middle" fill="#f4faff" fontSize="18" fontWeight="700">DRIVE</text>
              <text x="240" y="514" textAnchor="middle" fill="#b8d7e8" fontSize="11">192.168.10.30</text>
              <text x="240" y="532" textAnchor="middle" fill="#b8d7e8" fontSize="11">VLAN 10</text>
            </g>

            <g onClick={() => setSelected('motor')} className="device-group clickable">
              <rect x="510" y="440" width="180" height="120" rx="14" className={selected === 'motor' ? 'device-box selected' : 'device-box'} />
              <circle cx="570" cy="465" r="7" fill={motorStatus === 'RUNNING' ? '#3ce67d' : '#ffb000'} />
              <text x="600" y="490" textAnchor="middle" fill="#f4faff" fontSize="18" fontWeight="700">MOTOR</text>
              <text x="600" y="514" textAnchor="middle" fill="#b8d7e8" fontSize="11">192.168.10.40</text>
              <text x="600" y="532" textAnchor="middle" fill="#b8d7e8" fontSize="11">Status: {motorStatus}</text>
              <g transform={motorStatus === 'RUNNING' ? 'translate(600 570)' : 'translate(600 570)'}>
                <circle r="28" fill="none" stroke="#ffb000" strokeWidth="6" className={motorStatus === 'RUNNING' ? 'motor-rotor' : ''} />
                <line x1="0" y1="-24" x2="0" y2="24" stroke="#ffb000" strokeWidth="4" />
                <line x1="-24" y1="0" x2="24" y2="0" stroke="#ffb000" strokeWidth="4" />
              </g>
            </g>

            <g onClick={() => setSelected('sensor')} className="device-group clickable">
              <rect x="870" y="440" width="180" height="120" rx="14" className={selected === 'sensor' ? 'device-box selected' : 'device-box'} />
              <circle cx="930" cy="465" r="7" fill="#3ce67d" />
              <text x="960" y="490" textAnchor="middle" fill="#f4faff" fontSize="18" fontWeight="700">SENSOR</text>
              <text x="960" y="514" textAnchor="middle" fill="#b8d7e8" fontSize="11">192.168.10.50</text>
              <text x="960" y="532" textAnchor="middle" fill="#b8d7e8" fontSize="11">Speed + Temp</text>
            </g>

            <line x1="270" y1="280" x2="510" y2="280" stroke="#3ce67d" strokeWidth="4" markerEnd="url(#arrowGreen)" />
            <line x1="690" y1="280" x2="930" y2="280" stroke="#3ce67d" strokeWidth="4" markerEnd="url(#arrowGreen)" />
            <line x1="600" y1="340" x2="600" y2="440" stroke="#b57cff" strokeWidth="4" markerEnd="url(#arrowPurple)" strokeDasharray="7 7" />
            <line x1="240" y1="560" x2="510" y2="560" stroke="#3ce67d" strokeWidth="4" markerEnd="url(#arrowGreen)" />
            <line x1="960" y1="560" x2="960" y2="630" stroke="#47b3ff" strokeWidth="4" markerEnd="url(#arrowBlue)" strokeDasharray="6 6" />
            <line x1="960" y1="630" x2="710" y2="630" stroke="#47b3ff" strokeWidth="4" markerEnd="url(#arrowBlue)" strokeDasharray="6 6" />
            <line x1="710" y1="630" x2="710" y2="340" stroke="#47b3ff" strokeWidth="4" markerEnd="url(#arrowBlue)" strokeDasharray="6 6" />

            <text x="380" y="265" fill="#3ce67d" fontSize="14" fontWeight="700">EtherNet/IP</text>
            <text x="820" y="265" fill="#3ce67d" fontSize="14" fontWeight="700">CIP</text>
            <text x="775" y="622" fill="#47b3ff" fontSize="14" fontWeight="700">Feedback</text>

            {packet.visible && (
              <circle
                cx={packet.x}
                cy={packet.y}
                r="8"
                fill={packet.color}
                style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' }}
              />
            )}
          </svg>
        </section>

        <aside className="right-panel panel">
          <div className="metrics">
            <div className="metric-row"><span>Motor</span><strong className={motorStatus === 'RUNNING' ? 'run' : 'stop'}>{motorStatus}</strong></div>
            <div className="metric-row"><span>Speed</span><strong>{speed} RPM</strong></div>
            <div className="metric-row"><span>Temperature</span><strong>{temp}°C</strong></div>
            <div className="metric-row"><span>Drive</span><strong className={driveStatus === 'FAULT' ? 'fault' : driveStatus === 'RUN' ? 'run' : 'idle'}>{driveStatus}</strong></div>
            <div className="metric-row"><span>Network</span><strong className={networkStatus === 'HEALTHY' ? 'run' : 'fault'}>{networkStatus}</strong></div>
          </div>

          <div className="section-head">Communication Flow</div>
          <div className="flow-list">
            {flowSteps.map((step, index) => (
              <div key={step} className={index === activeIndex ? 'flow-item active' : index < activeIndex ? 'flow-item done' : 'flow-item'}>
                {index + 1}. {step}
              </div>
            ))}
          </div>

          <div className="section-head">Message Log</div>
          <div className="log-box">
            {logs.map((message, index) => (
              <div key={`${message}-${index}`} className="log-item">{message}</div>
            ))}
          </div>

          <div className="section-head">Network Details</div>
          <div className="tabs">
            <button className={tab === 'network' ? 'tab active' : 'tab'} onClick={() => setTab('network')}>Network</button>
            <button className={tab === 'arp' ? 'tab active' : 'tab'} onClick={() => setTab('arp')}>ARP</button>
            <button className={tab === 'packet' ? 'tab active' : 'tab'} onClick={() => setTab('packet')}>Packet</button>
          </div>

          {tab === 'network' && (
            <div className="panel-text">
              <table>
                <thead>
                  <tr><th>Device</th><th>IP</th><th>VLAN</th></tr>
                </thead>
                <tbody>
                  <tr><td>HMI</td><td>192.168.10.11</td><td>10</td></tr>
                  <tr><td>PLC</td><td>192.168.10.20</td><td>10</td></tr>
                  <tr><td>Drive</td><td>192.168.10.30</td><td>10</td></tr>
                  <tr><td>Motor</td><td>192.168.10.40</td><td>10</td></tr>
                  <tr><td>Sensor</td><td>192.168.10.50</td><td>10</td></tr>
                </tbody>
              </table>
              <p>Network: 192.168.10.0/24</p>
              <p>Broadcast: 192.168.10.255</p>
              <p>Default Gateway: 192.168.10.1</p>
            </div>
          )}

          {tab === 'arp' && (
            <div className="panel-text">
              <table>
                <thead>
                  <tr><th>IP</th><th>MAC</th></tr>
                </thead>
                <tbody>
                  <tr><td>192.168.10.11</td><td>AA:AA:AA:AA:AA:11</td></tr>
                  <tr><td>192.168.10.20</td><td>AA:AA:AA:AA:AA:20</td></tr>
                  <tr><td>192.168.10.30</td><td>AA:AA:AA:AA:AA:30</td></tr>
                </tbody>
              </table>
              <p>ARP resolves IPv4 addresses to MAC addresses on the local network.</p>
            </div>
          )}

          {tab === 'packet' && (
            <div className="panel-text">
              <p><strong>Source:</strong> HMI (192.168.10.11)</p>
              <p><strong>Destination:</strong> PLC (192.168.10.20)</p>
              <p><strong>Protocol:</strong> EtherNet/IP</p>
              <p><strong>Underlying:</strong> CIP</p>
              <p><strong>VLAN:</strong> 10</p>
              <p><strong>MAC Source:</strong> AA:AA:AA:AA:AA:11</p>
              <p><strong>MAC Dest:</strong> AA:AA:AA:AA:AA:20</p>
            </div>
          )}

          <div className="section-head">Selected Device</div>
          <div className="device-detail">
            <h3>{selectedDevice.name}</h3>
            <p><strong>IP:</strong> {selectedDevice.ip}</p>
            <p><strong>VLAN:</strong> {selectedDevice.vlan}</p>
            <p><strong>MAC:</strong> {selectedDevice.mac}</p>
            <p><strong>Role:</strong> {selectedDevice.role}</p>
            <p>{selectedDevice.summary}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
