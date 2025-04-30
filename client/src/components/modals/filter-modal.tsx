import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Interest } from '@shared/schema';
import { X } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  maxDistance: number;
  interests: Interest[];
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  maxDistance: number;
  profession: string;
  selectedInterests: number[];
  connectionStatus: 'all' | 'new' | 'connected';
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  maxDistance: initialMaxDistance,
  interests,
  currentFilters
}) => {
  const [maxDistance, setMaxDistance] = useState<number>(currentFilters.maxDistance);
  const [profession, setProfession] = useState<string>(currentFilters.profession);
  const [selectedInterests, setSelectedInterests] = useState<number[]>(currentFilters.selectedInterests);
  const [connectionStatus, setConnectionStatus] = useState<'all' | 'new' | 'connected'>(currentFilters.connectionStatus);
  
  const handleInterestToggle = (interestId: number) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };
  
  const handleReset = () => {
    setMaxDistance(initialMaxDistance);
    setProfession('');
    setSelectedInterests([]);
    setConnectionStatus('all');
  };
  
  const handleApply = () => {
    onApplyFilters({
      maxDistance,
      profession,
      selectedInterests,
      connectionStatus
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Filters</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Distance Filter */}
          <div>
            <Label className="block text-sm font-medium mb-2">Distance</Label>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-500">Max distance</span>
              <span className="text-sm font-medium text-primary">{maxDistance} miles</span>
            </div>
            <Slider 
              min={1}
              max={50}
              step={1}
              value={[maxDistance]}
              onValueChange={(values) => setMaxDistance(values[0])}
            />
          </div>
          
          {/* Profession Filter */}
          <div>
            <Label className="block text-sm font-medium mb-2">Profession</Label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger>
                <SelectValue placeholder="All Professions" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">All Professions</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Interests Filter */}
          <div>
            <Label className="block text-sm font-medium mb-2">Interests</Label>
            <div className="grid grid-cols-2 gap-2">
              {interests.map((interest) => (
                <div key={interest.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`interest-${interest.id}`}
                    checked={selectedInterests.includes(interest.id)}
                    onCheckedChange={() => handleInterestToggle(interest.id)}
                  />
                  <label 
                    htmlFor={`interest-${interest.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {interest.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Connection Status */}
          <div>
            <Label className="block text-sm font-medium mb-2">Show People</Label>
            <RadioGroup value={connectionStatus} onValueChange={(value: 'all' | 'new' | 'connected') => setConnectionStatus(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="status-all" />
                <Label htmlFor="status-all">Everyone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="status-new" />
                <Label htmlFor="status-new">New people only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="connected" id="status-connected" />
                <Label htmlFor="status-connected">Connections only</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset All
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
