import { useState, useCallback } from 'react'
import { parseGpx } from './utils/parseGpx'
import { deleteSelectedPoints } from './utils/gpxEdit'
import { buildExportXml, downloadGpx } from './utils/gpxExport'
import MapView from './components/MapView'
import './App.css'

export default function App() {
  const [track, setTrack] = useState(null)
  const [originalXml, setOriginalXml] = useState(null)
  const [inputFileName, setInputFileName] = useState('')
  const [showPoints, setShowPoints] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState(new Set())

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInputFileName(file.name)
    file.text().then(xml => {
      setOriginalXml(xml)
      setTrack(parseGpx(xml))
      setSelectedIndices(new Set())
      setSelectMode(false)
    })
  }

  const handleSelect = useCallback((bounds) => {
    if (!track) return
    const indices = new Set()
    track.points.forEach((pt, i) => {
      if (bounds.contains([pt.lat, pt.lon])) indices.add(i)
    })
    setSelectedIndices(indices)
  }, [track])

  const handleDelete = () => {
    if (!track || selectedIndices.size === 0) return
    const newPoints = deleteSelectedPoints(track.points, selectedIndices)
    setTrack({ ...track, points: newPoints })
    setSelectedIndices(new Set())
    setSelectMode(false)
  }

  const handleExport = () => {
    if (!track || !originalXml) return
    const xml = buildExportXml(originalXml, track.points)
    downloadGpx(xml, inputFileName)
  }

  const toggleSelectMode = () => {
    setSelectMode(m => !m)
    setSelectedIndices(new Set())
  }

  return (
    <div className={`map-container${selectMode ? ' select-mode' : ''}`}>
      <div className="control-panel">
        <input type="file" accept=".gpx" onChange={handleFile} />
        {track?.name && <span className="track-name">{track.name}</span>}
        <label>
          <input
            type="checkbox"
            checked={showPoints}
            onChange={e => setShowPoints(e.target.checked)}
          />
          Show points
        </label>
        {track && (
          <button className={`btn${selectMode ? ' btn-active' : ''}`} onClick={toggleSelectMode}>
            {selectMode ? 'Cancel selection' : 'Select region'}
          </button>
        )}
        <button
          className="btn btn-danger"
          disabled={selectedIndices.size === 0}
          onClick={handleDelete}
        >
          Delete {selectedIndices.size > 0 ? selectedIndices.size : ''} point{selectedIndices.size !== 1 ? 's' : ''}
        </button>
        <button
          className="btn"
          disabled={!track}
          onClick={handleExport}
        >
          Export track
        </button>
      </div>
      {track && (
        <MapView
          track={track}
          showPoints={showPoints}
          selectMode={selectMode}
          selectedIndices={selectedIndices}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
