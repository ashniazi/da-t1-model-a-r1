import React, { useState, useCallback, useMemo } from "react";
import { TinyColor } from "@ctrl/tinycolor";
import { SketchPicker } from "react-color";
import { saveAs } from "file-saver";

interface ColorData {
  hex: string;
  name: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
}

const generateColorName = (color: TinyColor) => {
  const { h, s, l } = color.toHsl();
  const hueNames = [
    "Red",
    "Orange",
    "Yellow",
    "Green",
    "Blue",
    "Purple",
    "Pink",
  ];
  const hueIndex = Math.floor((h % 360) / 60);
  const saturation = s > 0.5 ? "Vibrant" : "Muted";
  const lightness = l > 0.7 ? "Light" : l < 0.3 ? "Dark" : "";
  return `${lightness} ${saturation} ${hueNames[hueIndex]}`.trim();
};

const App: React.FC = () => {
  const [palette, setPalette] = useState<ColorData[]>(() => {
    const base = new TinyColor({ h: Math.random() * 360, s: 0.7, l: 0.5 });
    return Array(5)
      .fill(0)
      .map((_, i) => {
        const color = base.clone().spin(i * 30);
        return {
          hex: color.toHexString(),
          name: generateColorName(color),
          rgb: color.toRgbString(),
          hsl: color.toHslString(),
          hsv: color.toHsvString(),
          cmyk: color.toCmykString(),
        };
      });
  });

  const [adjustments, setAdjustments] = useState({
    hue: 0,
    saturation: 0,
    brightness: 0,
  });
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState<number | null>(null);

  const adjustPalette = useCallback(() => {
    setPalette((prev) =>
      prev.map((color) => {
        const tiny = new TinyColor(color.hex);
        const hsl = tiny.toHsl();
        hsl.h = (hsl.h + adjustments.hue) % 360;
        hsl.s = Math.max(0, Math.min(1, hsl.s + adjustments.saturation / 100));
        hsl.l = Math.max(0, Math.min(1, hsl.l + adjustments.brightness / 100));
        const newColor = new TinyColor(hsl);
        return {
          hex: newColor.toHexString(),
          name: generateColorName(newColor),
          rgb: newColor.toRgbString(),
          hsl: newColor.toHslString(),
          hsv: newColor.toHsvString(),
          cmyk: newColor.toCmykString(),
        };
      })
    );
  }, [adjustments]);

  const handleColorChange = useCallback((index: number, newColor: string) => {
    setPalette((prev) =>
      prev.map((color, i) => {
        if (i !== index) return color;
        const tiny = new TinyColor(newColor);
        return {
          hex: tiny.toHexString(),
          name: generateColorName(tiny),
          rgb: tiny.toRgbString(),
          hsl: tiny.toHslString(),
          hsv: tiny.toHsvString(),
          cmyk: tiny.toCmykString(),
        };
      })
    );
  }, []);

  const handleNameChange = useCallback((index: number, name: string) => {
    setPalette((prev) =>
      prev.map((color, i) => (i === index ? { ...color, name } : color))
    );
  }, []);

  const exportPalette = useCallback(() => {
    const blob = new Blob([JSON.stringify(palette, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "palette.json");
  }, [palette]);

  const getShades = useCallback((hex: string) => {
    const base = new TinyColor(hex);
    return Array(5)
      .fill(0)
      .map((_, i) => {
        const factor = (i - 2) * 0.2;
        return base
          .clone()
          .lighten(factor * 50)
          .toHexString();
      });
  }, []);

  const ColorTooltip: React.FC<{ color: ColorData; index: number }> = ({
    color,
    index,
  }) => {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, format: string) => {
      navigator.clipboard.writeText(text);
      setCopied(format);
      setTimeout(() => setCopied(null), 1500);
    };

    return (
      <div className="absolute z-20 -top-48 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-xl w-64">
        <input
          type="text"
          value={color.name}
          onChange={(e) => handleNameChange(index, e.target.value)}
          className="w-full bg-gray-700 text-white p-2 rounded mb-2"
        />
        {["hex", "rgb", "hsl", "hsv", "cmyk"].map((format) => (
          <div
            key={format}
            className="flex justify-between items-center py-1 cursor-pointer hover:bg-gray-700 rounded px-2"
            onClick={() =>
              copyToClipboard(color[format as keyof ColorData], format)
            }
          >
            <span className="uppercase">{format}</span>
            <span className="text-gray-400">
              {copied === format ? "Copied!" : color[format as keyof ColorData]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Menu Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm text-gray-600">Hue</label>
            <input
              type="range"
              min="-180"
              max="180"
              value={adjustments.hue}
              onChange={(e) => {
                setAdjustments((prev) => ({
                  ...prev,
                  hue: Number(e.target.value),
                }));
                adjustPalette();
              }}
              className="w-32"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Saturation</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.saturation}
              onChange={(e) => {
                setAdjustments((prev) => ({
                  ...prev,
                  saturation: Number(e.target.value),
                }));
                adjustPalette();
              }}
              className="w-32"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Brightness</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.brightness}
              onChange={(e) => {
                setAdjustments((prev) => ({
                  ...prev,
                  brightness: Number(e.target.value),
                }));
                adjustPalette();
              }}
              className="w-32"
            />
          </div>
        </div>
        <button
          onClick={exportPalette}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Export Palette
        </button>
      </div>

      {/* Main Palette Display */}
      <div className="mt-24 flex h-[calc(100vh-6rem)]">
        <div className="flex-1 flex">
          {palette.map((color, index) => (
            <div
              key={index}
              className="flex-1 relative group cursor-pointer transition-all hover:flex-[2]"
              style={{ backgroundColor: color.hex }}
              onClick={() => {
                setSelectedColor(index);
                setShowPicker(showPicker === index ? null : index);
              }}
            >
              <div className="absolute inset-0 group-hover:bg-black/10 transition-colors" />
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ColorTooltip color={color} index={index} />
              </div>
              {showPicker === index && (
                <div className="absolute z-20 top-4 left-4">
                  <SketchPicker
                    color={color.hex}
                    onChange={(newColor) =>
                      handleColorChange(index, newColor.hex)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Shades Panel */}
        {selectedColor !== null && (
          <div className="w-64 bg-white shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Shades</h3>
            {getShades(palette[selectedColor].hex).map((shade, i) => (
              <div
                key={i}
                className="h-12 mb-2 rounded flex items-center px-4 text-white"
                style={{ backgroundColor: shade }}
              >
                {shade}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
