"""Shared paths and the approved model's material helpers (read-only source)."""
from pathlib import Path
import importlib.util
import hashlib
import json
import sys
import bpy

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]
BASE = REPO_ROOT / 'biscuit_pics/generated/3d/miami-cinematic-eyes-refined'
SOURCE = BASE / 'model/biscuit-eyes-refined.blend'
spec = importlib.util.spec_from_file_location('approved_eyes', BASE / 'src/common.py')
approved_eyes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(approved_eyes)
legacy = approved_eyes.approved
legacy.c.ROOT = ROOT
MODEL_ID = 'biscuit-miami-soft-charm-poseable'
RIG_VERSION = 1

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + '\n')

def parts():
    return sorted((o for o in bpy.context.scene.objects if o.type == 'MESH' and o.get('base_part')), key=lambda o:o.name)

def flat(matrix):
    return [float(matrix[row][col]) for col in range(4) for row in range(4)]
