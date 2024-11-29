import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, ThumbsUp, Trash, Music, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BAND_MEMBERS = [
  "Franka",
  "Jake",
  "Jeroen",
  "Kamala",
  "Maria"
];

const LEAD_VOCALISTS = [
  "Jake",
  "Jeroen",
  "Kamala"
];

export default function Home() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkSongList, setBulkSongList] = useState('');
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongKey, setNewSongKey] = useState('');
  const [newSongBy, setNewSongBy] = useState('');
  const [newSongLead, setNewSongLead] = useState('');

  // Load songs from Supabase
  useEffect(() => {
    fetchSongs();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('songs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => {
        fetchSongs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('total_votes', { ascending: false })
        .order('title', { ascending: true });  // Added secondary sort by title

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async () => {
  if (newSongTitle.trim()) {
    try {
      console.log('Attempting to add song:', {
        title: newSongTitle.trim(),
        key: newSongKey || '',
        by: newSongBy.trim(),
        lead: newSongLead,
        votes: [],
        total_votes: 0
      });

      const { data, error } = await supabase
        .from('songs')
        .insert([{
          title: newSongTitle.trim(),
          key: newSongKey || '',
          by: newSongBy.trim(),
          lead: newSongLead,
          votes: [],
          total_votes: 0
        }])
        .select(); // Add this to get back the inserted data

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Success adding song:', data);

      setNewSongTitle('');
      setNewSongKey('');
      setNewSongBy('');
      setNewSongLead('');
    } catch (error) {
      console.error('Error adding song:', error);
    }
  }
};

  const handleBulkAdd = async () => {
    const newSongs = bulkSongList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [title, artist] = line.split('-').map(s => s.trim());
        return {
          title: title || line,
          key: '',
          by: artist || '',
          lead: '',
          votes: [],
          total_votes: 0
        };
      });

    try {
      const { error } = await supabase
        .from('songs')
        .insert(newSongs);

      if (error) throw error;

      setBulkSongList('');
      setShowBulkAdd(false);
    } catch (error) {
      console.error('Error bulk adding songs:', error);
    }
  };

  const handleKeyChange = async (songId: number, newKey: string) => {
    try {
      const { error } = await supabase
        .from('songs')
        .update({ key: newKey })
        .eq('id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating song key:', error);
    }
  };

  const handleLeadChange = async (songId: number, newLead: string) => {
    try {
      const { error } = await supabase
        .from('songs')
        .update({ lead: newLead })
        .eq('id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating song lead:', error);
    }
  };

  const handleRemoveSong = async (songId: number) => {
    if (confirm('Are you sure you want to remove this song?')) {
      try {
        const { error } = await supabase
          .from('songs')
          .delete()
          .eq('id', songId);

        if (error) throw error;
      } catch (error) {
        console.error('Error removing song:', error);
      }
    }
  };

  const handleVote = async (songId: number) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const currentVotes = song.votes || [];
    let newVotes;
    let newTotalVotes;

    if (currentVotes.includes(selectedMember)) {
      newVotes = currentVotes.filter(v => v !== selectedMember);
      newTotalVotes = song.total_votes - 1;
    } else {
      newVotes = [...currentVotes, selectedMember];
      newTotalVotes = song.total_votes + 1;
    }

    try {
      const { error } = await supabase
        .from('songs')
        .update({
          votes: newVotes,
          total_votes: newTotalVotes
        })
        .eq('id', songId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating votes:', error);
    }
  };

  if (!selectedMember) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-6 w-6" />
              Diamond Voices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full p-2 border rounded"
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              <option value="">Select your name...</option>
              {BAND_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div>Loading songs...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Diamond Voices - Song List</span>
            <span className="text-sm">Signed in as: {selectedMember}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Enter song title"
              value={newSongTitle}
              onChange={(e) => setNewSongTitle(e.target.value)}
            />
            <Input
              placeholder="By (optional)"
              value={newSongBy}
              onChange={(e) => setNewSongBy(e.target.value)}
              className="w-40"
            />
            <select
              value={newSongKey}
              onChange={(e) => setNewSongKey(e.target.value)}
              className="w-24 p-2 border rounded"
            >
              {['', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab',
                'Am', 'Em', 'Bm', 'F#m', 'Dm', 'Gm', 'Cm'].map(key => (
                <option key={key} value={key}>
                  {key === '' ? 'Key' : key}
                </option>
              ))}
            </select>
            <select
              value={newSongLead}
              onChange={(e) => setNewSongLead(e.target.value)}
              className="w-32 p-2 border rounded"
            >
              <option value="">Lead</option>
              {LEAD_VOCALISTS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
            <Button onClick={handleAddSong}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowBulkAdd(!showBulkAdd)}
            className="mb-4"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showBulkAdd ? 'Hide Bulk Add' : 'Bulk Add Songs'}
          </Button>

          {showBulkAdd && (
            <div className="mb-4">
              <textarea
                className="w-full h-32 p-2 border rounded mb-2"
                placeholder="Enter songs in format: 'Song Title - Artist' (one per line)
Example:
Imagine - John Lennon
Yesterday - The Beatles"
                value={bulkSongList}
                onChange={(e) => setBulkSongList(e.target.value)}
              />
              <Button onClick={handleBulkAdd}>Add All Songs</Button>
            </div>
          )}

          <div className="space-y-2">
            {songs.map((song, index) => (
              <div key={song.id} className="p-4 bg-gray-100 rounded-lg">
                <div className="flex">
                  <div className="flex flex-grow gap-4">
                    <div className="w-8 text-gray-500 font-medium">
                      {index + 1}.
                    </div>
                    <div>
                      <div className="font-medium text-lg">{song.title}</div>
                      <div className="text-sm text-gray-600">{song.by}</div>
                      <div className="text-sm text-gray-600">
                        Votes: {(song.votes || []).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={song.key || ''}
                      onChange={(e) => handleKeyChange(song.id, e.target.value)}
                      className="w-24 p-2 border rounded bg-white"
                    >
                      {['', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab',
                        'Am', 'Em', 'Bm', 'F#m', 'Dm', 'Gm', 'Cm'].map(key => (
                        <option key={key} value={key}>
                          {key === '' ? 'Key' : key}
                        </option>
                      ))}
                    </select>
                    <select
                      value={song.lead || ''}
                      onChange={(e) => handleLeadChange(song.id, e.target.value)}
                      className="w-28 p-2 border rounded bg-white"
                    >
                      <option value="">Lead</option>
                      {LEAD_VOCALISTS.map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => handleVote(song.id)}
                      className="w-20 bg-white"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {song.total_votes}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveSong(song.id)}
                      className="w-10 bg-white"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}